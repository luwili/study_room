#!/usr/bin/env python3
"""
Скрипт прямой высокоскоростной синхронизации расписания группы ПОНБ-УП-304С
и объявлений института/куратора с личным кабинетом ИСУ УУНиТ (https://isu.uust.ru).

Параллельно запрашивает:
1. Расписание группы (модуль schedule_2024_script.php)
2. Официальную ленту объявлений института и ректората (/viewnews/)
3. Объединяет с кураторскими и закрепленными объявлениями
"""

import sys
import os
import json
import ssl
import re
import html
import urllib.request
import urllib.parse
import http.cookiejar
from datetime import datetime, timezone, timedelta
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

GROUP_ID = 13799
SEMESTER_ID = 241
SEMESTER_START = datetime(2026, 9, 1)
UFA_TZ = timezone(timedelta(hours=5))

SUBJECT_MAP = {
    'Основы финансовой грамотности': 'fin-gramotnost',
    'Специальная профессиональная подготовка': 'spec-podgotovka',
    'Финансовое право': 'fin-pravo',
    'Гражданское право (часть 2)': 'grazhd-pravo-2',
    'Уголовно-процессуальное право (уголовный процесс)': 'ugolov-proc',
    'Административный судебный процесс': 'admin-proc',
    'Общая физическая подготовка': 'ofp',
    'Экологическое право': 'eco-pravo',
    'Уголовное право (особенная часть)': 'ugolov-pravo-osob',
    'Гражданское процессуальное право (гражданский процесс)': 'grazhd-proc',
    'Международное право': 'int-pravo',
    'Экономические основы бизнеса': 'econ-biz',
}

WEEKDAYS = [
    (1, 'Понедельник'),
    (2, 'Вторник'),
    (3, 'Среда'),
    (4, 'Четверг'),
    (5, 'Пятница'),
    (6, 'Суббота'),
]

BELL_SCHEDULE = [
    {
        "pair": 1,
        "shift": 1,
        "shiftPair": 1,
        "label": "1 ПАРА",
        "timeStart": "08:00",
        "timeEnd": "09:20",
        "break": "10 минут"
    },
    {
        "pair": 2,
        "shift": 1,
        "shiftPair": 2,
        "label": "2 ПАРА",
        "timeStart": "09:30",
        "timeEnd": "10:50",
        "break": "20 минут"
    },
    {
        "pair": 3,
        "shift": 1,
        "shiftPair": 3,
        "label": "3 ПАРА",
        "timeStart": "11:10",
        "timeEnd": "12:30",
        "break": "10 минут"
    },
    {
        "pair": 4,
        "shift": 1,
        "shiftPair": 4,
        "label": "4 ПАРА",
        "timeStart": "12:40",
        "timeEnd": "14:00",
        "break": "10 минут"
    },
    {
        "pair": 5,
        "shift": 2,
        "shiftPair": 1,
        "label": "1 ПАРА (2 смена)",
        "timeStart": "14:10",
        "timeEnd": "15:30",
        "break": "10 минут"
    },
    {
        "pair": 6,
        "shift": 2,
        "shiftPair": 2,
        "label": "2 ПАРА (2 смена)",
        "timeStart": "15:40",
        "timeEnd": "17:00",
        "break": "20 минут"
    },
    {
        "pair": 7,
        "shift": 2,
        "shiftPair": 3,
        "label": "3 ПАРА (2 смена)",
        "timeStart": "17:20",
        "timeEnd": "18:40",
        "break": "10 минут"
    },
    {
        "pair": 8,
        "shift": 2,
        "shiftPair": 4,
        "label": "4 ПАРА (2 смена)",
        "timeStart": "18:50",
        "timeEnd": "20:10",
        "break": "10 минут"
    },
    {
        "pair": 9,
        "shift": 2,
        "shiftPair": 5,
        "label": "5 ПАРА (2 смена)",
        "timeStart": "20:20",
        "timeEnd": "21:40",
        "break": ""
    }
]

PAIR_TIMES = {
    1: ("08:00", "09:20"),
    2: ("09:30", "10:50"),
    3: ("11:10", "12:30"),
    4: ("12:40", "14:00"),
    5: ("14:10", "15:30"),
    6: ("15:40", "17:00"),
    7: ("17:20", "18:40"),
    8: ("18:50", "20:10"),
    9: ("20:20", "21:40")
}

def get_credentials():
    login = os.environ.get('ISU_LOGIN')
    password = os.environ.get('ISU_PASSWORD')
    if login and password:
        return login.strip(), password.strip()
    
    cred_file = Path(__file__).resolve().parent.parent / 'private-data' / 'isu_credentials.json'
    if cred_file.exists():
        try:
            with open(cred_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('login', '').strip(), data.get('password', '').strip()
        except Exception:
            pass
    return None, None

def calculate_current_week():
    now_ufa = datetime.now(UFA_TZ)
    monday_start = SEMESTER_START.replace(tzinfo=UFA_TZ) - timedelta(days=SEMESTER_START.weekday())
    
    if now_ufa.weekday() == 6 and now_ufa.hour >= 12:
        target_date = now_ufa + timedelta(days=1)
    else:
        target_date = now_ufa
        
    current_monday = target_date - timedelta(days=target_date.weekday())
    current_monday = current_monday.replace(hour=0, minute=0, second=0, microsecond=0)
    diff_days = (current_monday - monday_start).days
    return max(1, diff_days // 7 + 1)

def create_opener():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    cj = http.cookiejar.CookieJar()
    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cj),
        urllib.request.HTTPSHandler(context=ctx)
    )

def authenticate_isu(opener, login, password):
    """Выполняет вход в личный кабинет ИСУ УУНиТ."""
    req1 = urllib.request.Request(
        "https://isu.uust.ru/login/",
        headers={"User-Agent": "Mozilla/5.0"}
    )
    html1 = opener.open(req1, timeout=6).read().decode('utf-8')
    form_num_match = re.search(r"name=[\"']form_num[\"']\s+value=[\"']([^\"']+)[\"']", html1)
    if not form_num_match:
        raise RuntimeError("Не удалось получить form_num на странице логина ИСУ")
    form_num = form_num_match.group(1)

    login_data = urllib.parse.urlencode({
        "form_num": form_num,
        "login": login,
        "password": password
    }).encode('utf-8')

    opener.open(urllib.request.Request(
        "https://isu.uust.ru/login/",
        data=login_data,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://isu.uust.ru/login/",
            "Content-Type": "application/x-www-form-urlencoded"
        }
    ), timeout=6)

def fetch_schedule_isu(opener, target_week):
    """Запрашивает расписание занятий группы ПОНБ-УП-304С из ИСУ."""
    post_data = urllib.parse.urlencode({
        "group_id": GROUP_ID,
        "week": target_week,
        "funct": "group",
        "show_temp": 0
    }).encode('utf-8')

    r = opener.open(urllib.request.Request(
        "https://isu.uust.ru/module/schedule/schedule_2024_script.php",
        data=post_data,
        headers={
            "User-Agent": "Mozilla/5.0",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded"
        }
    ), timeout=6)
    resp_html = r.read().decode('utf-8')

    pattern = r"\$\('#(\d+)_(\d+)_group'\)\.append\('<div><br>(.*?)<br><button[^>]*>([^<]+)</button><br><button[^>]*>([^<]+)</button><br></div>'\)"
    matches = re.findall(pattern, resp_html)

    parsed_entries = []
    for pair_str, day_str, subj_raw, teacher, room in matches:
        pair_num = int(pair_str)
        day_num = int(day_str)
        
        type_m = re.search(r'\(((?:Практика|Лекция|Семинар|Лабораторная|Зачёт|Экзамен)[^()]*(\([^()]*\))?)\)$', subj_raw.strip())
        lesson_type = type_m.group(1).strip() if type_m else "Практика (семинар)"
        subj_title = re.sub(r'\s*\(' + re.escape(lesson_type) + r'\)$', '', subj_raw.strip())

        time_start, time_end = PAIR_TIMES.get(pair_num, ("08:00", "09:20"))
        parsed_entries.append({
            'day': day_num,
            'pair': pair_num,
            'timeStart': time_start,
            'timeEnd': time_end,
            'subject': subj_title,
            'type': lesson_type,
            'teacher': teacher.strip(),
            'room': room.strip()
        })

    return parsed_entries

def fetch_announcements_isu(opener):
    """Синхронизирует официальные объявления института и университета из ИСУ УУНиТ."""
    try:
        home_html = opener.open("https://isu.uust.ru/", timeout=6).read().decode('utf-8', errors='ignore')
    except Exception as e:
        print("Не удалось загрузить главную страницу объявлений ИСУ:", e)
        return []

    idx = home_html.find("Новостная лента студентов")
    if idx == -1:
        return []

    news_block = home_html[idx:idx+9000]
    items = re.findall(r"<li[^>]*>(.*?)</li>", news_block, re.DOTALL)
    
    def parse_item(it):
        link_m = re.search(r"href=[\"'](/viewnews/([a-f0-9]+)/?)[\"']>([^<]+)</a>", it)
        if not link_m:
            return None
        rel_url = link_m.group(1)
        art_hash = link_m.group(2)
        raw_title = html.unescape(link_m.group(3).strip())
        
        date_m = re.search(r"\((\d{2}\.\d{2}\.\d{4})\)", raw_title)
        if date_m:
            pub_date = date_m.group(1)
            title = raw_title.replace(f"({pub_date})", "").strip()
            d, m, y = pub_date.split(".")
            iso_date = f"{y}-{m}-{d}"
        else:
            title = raw_title
            iso_date = datetime.now(UFA_TZ).strftime("%Y-%m-%d")

        img_m = re.search(r"src=[\"'](https://[^\s\"']+)[\"']", it)
        img_url = img_m.group(1) if img_m else ""

        full_url = f"https://isu.uust.ru{rel_url}"
        summary = title
        try:
            art_html = opener.open(full_url, timeout=3).read().decode('utf-8', errors='ignore')
            quote_m = re.search(r"<blockquote>\s*<p>(.*?)</p>\s*</blockquote>", art_html, re.DOTALL)
            if quote_m:
                summary = re.sub(r"<[^>]+>", " ", quote_m.group(1))
            else:
                p_idx = art_html.find("panel-body")
                if p_idx != -1:
                    raw_p = art_html[p_idx+10:p_idx+3500]
                    raw_p = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", raw_p, flags=re.DOTALL)
                    summary = re.sub(r"<[^>]+>", " ", raw_p)
            summary = html.unescape(summary)
            summary = re.sub(r"\s+", " ", summary).strip()
            summary = re.sub(r"^style=[^\s>]+>\s*", "", summary)
            summary = re.sub(r"^\d{2}\.\d{2}\.\d{4}\s*", "", summary)
            if len(summary) > 280:
                summary = summary[:280].rstrip() + "..."
        except Exception:
            pass

        item_dict = {
            "id": f"ann-isu-{art_hash[:8]}",
            "title": title,
            "content": summary or title,
            "date": iso_date,
            "isPinned": False,
            "author": "Институт / Ректорат УУНиТ",
            "tag": "Институт",
            "url": full_url
        }
        if img_url:
            item_dict["imageUrl"] = img_url

        return item_dict

    with ThreadPoolExecutor(max_workers=5) as pool:
        parsed_items = [res for res in pool.map(parse_item, items[:6]) if res]

    return parsed_items

def fetch_session_data_isu(opener):
    """Синхронизирует экзамены, зачеты и учебный план из личного кабинета ИСУ УУНиТ."""
    try:
        home_html = opener.open("https://isu.uust.ru/", timeout=8).read().decode('utf-8', errors='ignore')
        pv_m = re.search(r'href=[\"\x27](/student_points_view/(\d+)/([a-f0-9]+)/?)[\"\x27]', home_html)
        if not pv_m:
            print("Ссылка на успеваемость не найдена в главном меню ИСУ.")
            return None

        points_rel_url = pv_m.group(1)
        student_id = int(pv_m.group(2))
        student_hex = pv_m.group(3)

        url_handler = 'https://isu.uust.ru/module/contingent/student_points_view_handler.php'
        r_books = opener.open(urllib.request.Request(
            url_handler,
            data=json.dumps({'function': 'get_study_books_new', 'student_isu_person_id': student_id, 'hex': student_hex}).encode('utf-8'),
            headers={'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json'}
        ), timeout=8)
        books = json.loads(r_books.read().decode('utf-8'))
        active_book = list(books.values())[0] if isinstance(books, dict) else books[0]

        r_plan = opener.open(urllib.request.Request(
            url_handler,
            data=json.dumps({
                'function': 'get_points_try',
                'study_book': active_book['study_book'],
                'ind_plan': False,
                'student_isu_person_id': student_id,
                'group_id': active_book['group_id'],
                'hex': student_hex
            }).encode('utf-8'),
            headers={'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json'}
        ), timeout=8)
        res = json.loads(r_plan.read().decode('utf-8'))

        root_dir = Path(__file__).resolve().parent.parent
        subj_path = root_dir / 'src' / 'data' / 'subjects.json'
        sess_path = root_dir / 'src' / 'data' / 'session.json'

        subjects = []
        if subj_path.exists():
            with open(subj_path, 'r', encoding='utf-8') as f:
                subjects = json.load(f)

        TYPE_NAMES = {
            '3': 'Экзамен',
            '2': 'Зачёт',
            '10': 'РГР',
            '6': 'Диф. зачёт',
            '1': 'Диф. зачёт',
            '4': 'Курсовая работа',
            '5': 'Курсовой проект',
            '7': 'Контрольная работа',
            '17': 'Контрольная работа',
            '15': 'Эссе',
            '9': 'Реферат',
            '16': 'ГИА'
        }

        sem5_items = res.get('plan', {}).get('5', {})
        items = sem5_items.values() if isinstance(sem5_items, dict) else sem5_items

        exams = []
        credits_list = []

        for disc in items:
            if not isinstance(disc, dict):
                continue
            title = (disc.get('subject_study_book') or disc.get('subject') or '').strip()
            if not title:
                continue
            credits_val = disc.get('credits', 0)
            lec = disc.get('lec', 0)
            prc = disc.get('prc', 0)
            slf = disc.get('slf', 0)
            total_hours = disc.get('summaryHoursStudied', lec + prc + slf)

            matched_subj = None
            for s in subjects:
                s_t = s['title'].strip().lower()
                if s_t in title.lower() or title.lower() in s_t:
                    matched_subj = s
                    break

            teacher = matched_subj['teacherName'] if matched_subj else 'Преподаватель кафедры'
            department = matched_subj['departmentName'] if matched_subj else 'Институт права УУНиТ'

            points = disc.get('points', {})
            if isinstance(points, dict):
                for k, v in points.items():
                    if isinstance(v, dict) and v.get('plan'):
                        ctrl_type = TYPE_NAMES.get(str(k), 'Аттестация')

                        entry = {
                            'id': f'sem5-{disc.get("discipline_id", len(exams)+len(credits_list)+1)}-{k}',
                            'disciplineId': disc.get('discipline_id'),
                            'subject': title,
                            'shortSubject': matched_subj['shortTitle'] if matched_subj else title,
                            'subjectId': matched_subj['id'] if matched_subj else None,
                            'controlType': ctrl_type,
                            'credits': credits_val,
                            'hours': {
                                'lectures': lec,
                                'practice': prc,
                                'self': slf,
                                'total': total_hours
                            },
                            'teacher': 'Гиззатуллин Равиль Хасанович (Зав. кафедрой)' if ('эколог' in title.lower() and ctrl_type == 'Экзамен') else ('Ситдикова Гузель Зуфаровна (экзамен, проверка конспектов) / Мусабиров Эмиль Ильдарович (семинары)' if ('уголовное право (особенная часть)' in title.lower() and ctrl_type == 'Экзамен') else teacher),
                            'examNote': 'Может проверить наличие рукописного конспекта лекций' if ('уголовное право (особенная часть)' in title.lower() and ctrl_type == 'Экзамен') else None,
                            'department': department
                        }
                        if ctrl_type == 'Экзамен':
                            exams.append(entry)
                        else:
                            credits_list.append(entry)

        # All semesters overview (общий учебный план группы)
        all_sems = {}
        for s_num in sorted([k for k in res.get('plan', {}).keys() if str(k).isdigit()], key=int):
            s_data = res['plan'][s_num]
            s_items = s_data.values() if isinstance(s_data, dict) else s_data
            disc_list = []
            for d in s_items:
                if not isinstance(d, dict):
                    continue
                d_title = (d.get('subject_study_book') or d.get('subject') or '').strip()
                if not d_title:
                    continue
                pts = d.get('points', {})
                ctrl_list = []
                if isinstance(pts, dict):
                    for pk, pv in pts.items():
                        if isinstance(pv, dict) and pv.get('plan'):
                            c_name = TYPE_NAMES.get(str(pk), f'Тип {pk}')
                            ctrl_list.append(c_name)
                disc_list.append({
                    'title': d_title,
                    'credits': d.get('credits', 0),
                    'controls': ctrl_list
                })
            all_sems[str(s_num)] = disc_list

        session_data = {
            'group': 'ПОНБ-УП-304С',
            'specialty': '40.05.01 Правовое обеспечение национальной безопасности',
            'specialization': 'Уголовно-правовая',
            'currentSemester': 5,
            'course': 3,
            'academicYear': '2026/2027',
            'lastSyncedAt': datetime.now(UFA_TZ).strftime('%Y-%m-%d %H:%M:%S UTC+5'),
            'currentSession': {
                'title': 'Зимняя экзаменационная сессия 2026/2027 (5 семестр, 3 курс)',
                'examsCount': len(exams),
                'creditsCount': len(credits_list),
                'totalDisciplines': len(exams) + len(credits_list),
                'exams': exams,
                'credits': credits_list
            },
            'allSemesters': all_sems
        }

        with open(sess_path, 'w', encoding='utf-8') as f:
            json.dump(session_data, f, ensure_ascii=False, indent=2)

        # Update subjects.json examType
        updated_any = False
        for s in subjects:
            s_t = s['title'].strip().lower()
            for ex in exams:
                if ex['subject'].strip().lower() in s_t or s_t in ex['subject'].strip().lower():
                    if s.get('examType') != 'Экзамен':
                        s['examType'] = 'Экзамен'
                        updated_any = True
            for cr in credits_list:
                if cr['subject'].strip().lower() in s_t or s_t in cr['subject'].strip().lower():
                    # If it was marked as Exam, but is Credit in semester 5
                    if s.get('examType') != 'Зачёт' and not any(ex['subject'].strip().lower() in s_t for ex in exams):
                        s['examType'] = 'Зачёт'
                        updated_any = True

        if updated_any and subjects:
            with open(subj_path, 'w', encoding='utf-8') as f:
                json.dump(subjects, f, ensure_ascii=False, indent=2)

        print(f"Данные сессии успешно синхронизированы: {len(exams)} экзаменов, {len(credits_list)} зачётов. Сохранено в {sess_path}.")
        return session_data
    except Exception as e:
        print("Ошибка синхронизации сессии из ИСУ УУНиТ:", e)
        return None

def format_room(raw_room, subj_title):
    if not raw_room:
        return "Институт права"
    if 'физическая' in subj_title.lower() or 'уточняется' in raw_room.lower() or 'спорт' in raw_room.lower():
        return "Спорткомплекс УУНиТ (ул. Заки Валиди, 32 / Уточняется)"
    if 'актовый зал' in raw_room.lower():
        return "Актовый зал (Достоевского 131)"
    m = re.search(r'-\s*([0-9]{2,4}[а-яА-Я]?)\b', raw_room)
    if m:
        return f"каб. {m.group(1)} (Достоевского 131)"
    m2 = re.findall(r'\b(\d{3}[а-яА-Я]?)\b', raw_room)
    rooms = [r for r in m2 if r != '131']
    if rooms:
        return f"каб. {rooms[-1]} (Достоевского 131)"
    return raw_room

def build_week_days(w, entries, monday_start):
    week_monday = monday_start + timedelta(weeks=w - 1)
    days_data = []
    for day_id, day_name in WEEKDAYS:
        day_date = week_monday + timedelta(days=day_id - 1)
        day_entries = [e for e in entries if e['day'] == day_id]
        day_entries.sort(key=lambda x: x['pair'])

        pairs = []
        for idx, entry in enumerate(day_entries, start=1):
            subj_title = entry['subject']
            subj_id = SUBJECT_MAP.get(subj_title, 'other')
            room_str = format_room(entry['room'], subj_title)

            teacher = entry['teacher']
            if 'Нурмухаметов' in teacher:
                teacher = f"{teacher} (Куратор)"

            pairs.append({
                "id": f"sch-w{w}-{day_id}-{idx}",
                "pairNumber": entry['pair'],
                "timeStart": entry['timeStart'],
                "timeEnd": entry['timeEnd'],
                "subjectId": subj_id,
                "subjectName": subj_title,
                "type": entry['type'],
                "teacher": teacher,
                "room": room_str,
                "notes": f"Занятие по расписанию ИСУ УУНиТ ({entry['type']})"
            })

        days_data.append({
            "dayOfWeek": day_id,
            "dayName": day_name,
            "date": day_date.strftime("%Y-%m-%d"),
            "pairs": pairs
        })
    return days_data

def fetch_all_weeks_dev(group_id, semester_id):
    try:
        url = f"https://dev.uust-time.ru/api/v/852972/schedule/0/{group_id}/semester/{semester_id}?site=schedule"
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8'))
        weeks_map = {w: [] for w in range(1, 18)}
        for e in data:
            p_num = e.get('schedule_time_num', 1)
            t_start, t_end = PAIR_TIMES.get(p_num, ("08:00", "09:20"))
            bld = e.get('building_short_title', '')
            rm = e.get('room_title', '')
            entry = {
                'day': e.get('schedule_weekday_id'),
                'pair': p_num,
                'timeStart': t_start,
                'timeEnd': t_end,
                'subject': e.get('schedule_subject_title', ''),
                'type': e.get('type', 'Практика (семинар)'),
                'teacher': e.get('teacher_fullname', '').strip(),
                'room': f"{bld} - {rm}".strip('- ') if rm else 'Институт права'
            }
            for w_str in e.get('schedule_weeks', []):
                if str(w_str).isdigit():
                    wn = int(w_str)
                    if 1 <= wn <= 17:
                        weeks_map[wn].append(entry)
        return weeks_map
    except Exception as e:
        print("Ошибка резервного API расписания:", e)
        return {}

def sync_all(target_week=None, force=False):
    if target_week is None:
        target_week = calculate_current_week()

    now_ufa = datetime.now(UFA_TZ)
    print(f"[{now_ufa.strftime('%Y-%m-%d %H:%M:%S')} UTC+5] Синхронизация расписания (все 17 недель) и объявлений для недели {target_week}...")

    login, password = get_credentials()
    opener = create_opener()

    all_weeks_raw = {}
    ann_entries = []

    if login and password:
        try:
            print(f"Авторизация в ИСУ УУНиТ под аккаунтом {login[:4]}***...")
            authenticate_isu(opener, login, password)

            # Параллельный сбор расписания всех 17 недель, объявлений и сессии
            with ThreadPoolExecutor(max_workers=8) as ex:
                f_ann = ex.submit(fetch_announcements_isu, opener)
                f_sess = ex.submit(fetch_session_data_isu, opener)
                week_futs = {w: ex.submit(fetch_schedule_isu, opener, w) for w in range(1, 18)}
                ann_entries = f_ann.result()
                f_sess.result()
                for w, fut in week_futs.items():
                    all_weeks_raw[w] = fut.result()

            total_isu_pairs = sum(len(p) for p in all_weeks_raw.values())
            print(f"Из ИСУ УУНиТ получено: {total_isu_pairs} пар суммарно на 17 недель, {len(ann_entries)} объявлений.")
        except Exception as e:
            print("Ошибка при параллельном запросе к ИСУ УУНиТ:", e)

    # Резервный источник расписания при сбое авторизации
    if not any(all_weeks_raw.values()):
        print("Запрос расписания через резервный открытый API dev.uust-time.ru...")
        all_weeks_raw = fetch_all_weeks_dev(GROUP_ID, SEMESTER_ID)

    # 1. Формирование расписания на весь семестр и на выбранную неделю
    monday_start = SEMESTER_START.replace(tzinfo=UFA_TZ) - timedelta(days=SEMESTER_START.weekday())
    weeks_dict = {}
    total_semester_pairs = 0

    for w in range(1, 18):
        week_monday = monday_start + timedelta(weeks=w - 1)
        week_sunday = week_monday + timedelta(days=6)
        entries = all_weeks_raw.get(w, [])
        w_days = build_week_days(w, entries, monday_start)
        w_pairs_count = sum(len(d['pairs']) for d in w_days)
        total_semester_pairs += w_pairs_count

        weeks_dict[str(w)] = {
            "weekNumber": w,
            "weekType": "even" if w % 2 == 0 else "odd",
            "startDate": week_monday.strftime("%Y-%m-%d"),
            "endDate": week_sunday.strftime("%Y-%m-%d"),
            "label": f"{week_monday.strftime('%d.%m')} – {week_sunday.strftime('%d.%m')}",
            "totalPairs": w_pairs_count,
            "days": w_days
        }

    target_week_key = str(target_week)
    if target_week_key in weeks_dict:
        days_data = weeks_dict[target_week_key]["days"]
    else:
        days_data = weeks_dict.get("8", {}).get("days", [])

    root_dir = Path(__file__).resolve().parent.parent
    sched_path = root_dir / 'src' / 'data' / 'schedule.json'
    ann_path = root_dir / 'src' / 'data' / 'announcements.json'

    # Сохранение расписания (с защитой от затирания при сбое авторизации или ночных работах ИСУ УУНиТ)
    if total_semester_pairs == 0:
        print("ВНИМАНИЕ: Из ИСУ УУНиТ получено 0 пар. Существующее расписание сохранено в безопасности (перезапись заблокирована).")
    else:
        saved_bell_sched = BELL_SCHEDULE
        if sched_path.exists():
            try:
                with open(sched_path, 'r', encoding='utf-8') as f:
                    old_data = json.load(f)
                    if 'bellSchedule' in old_data and old_data['bellSchedule']:
                        saved_bell_sched = old_data['bellSchedule']
            except Exception:
                pass

        doc_sched = {
            "group": "ПОНБ-УП-304С",
            "semester": "Осенний семестр 2026/2027",
            "timezone": "Asia/Yekaterinburg",
            "currentWeekNumber": target_week,
            "weekType": "even" if target_week % 2 == 0 else "odd",
            "building": "Институт права (ул. Достоевского, 131)",
            "lastSyncedAt": now_ufa.strftime('%Y-%m-%d %H:%M:%S UTC+5'),
            "totalSemesterPairs": total_semester_pairs,
            "totalSemesterWeeks": 17,
            "bellSchedule": saved_bell_sched,
            "weeks": weeks_dict,
            "days": days_data
        }
        with open(sched_path, 'w', encoding='utf-8') as f:
            json.dump(doc_sched, f, ensure_ascii=False, indent=2)
        print(f"Расписание ({total_semester_pairs} пар на 17 недель) сохранено в {sched_path}.")

        # Дополнительная репликация в public/data и android assets для прямого CDN и оффлайн-виджета
        public_sched = root_dir / 'public' / 'data' / 'schedule.json'
        public_sched.parent.mkdir(parents=True, exist_ok=True)
        with open(public_sched, 'w', encoding='utf-8') as f:
            json.dump(doc_sched, f, ensure_ascii=False, indent=2)

        android_sched = root_dir / 'android' / 'app' / 'src' / 'main' / 'assets' / 'schedule.json'
        android_sched.parent.mkdir(parents=True, exist_ok=True)
        with open(android_sched, 'w', encoding='utf-8') as f:
            json.dump(doc_sched, f, ensure_ascii=False, indent=2)

    # 2. Формирование и слияние объявлений
    base_defaults = [
        {
            "id": "ann-1",
            "title": "Организационное собрание группы ПОНБ-УП-304С с куратором",
            "content": "Уважаемые студенты группы ПОНБ-УП-304С! В среду после 4 пары (в 14:40) в аудитории 107 (ул. Достоевского, 131) состоится кураторский час. Повестка: промежуточная аттестация, посещаемость занятий, подготовка к зачетной сессии и участие в научно-практической конференции Института права.",
            "date": "2026-10-21",
            "isPinned": True,
            "author": "Нурмухаметов Р.Н., куратор группы",
            "tag": "Куратор"
        },
        {
            "id": "ann-2",
            "title": "Расписание на осенний семестр 2026: актуальный график",
            "content": "Утверждено и опубликовано расписание учебных занятий группы ПОНБ-УП-304С на 8-ю неделю. Просьба обратить внимание на пары по административному процессу в четверг (ауд. 313) и финансовому праву (ауд. 405). Официальный первоисточник: https://law-bsu.ru/schedules.",
            "date": "2026-10-19",
            "isPinned": True,
            "author": "Учебная часть Института права",
            "tag": "Расписание"
        },
        {
            "id": "ann-3",
            "title": "Всероссийская студенческая научно-практическая конференция Института права УУНиТ",
            "content": "Кафедра уголовного права и процесса приглашает студентов специальности «Правовое обеспечение национальной безопасности» принять участие в секции уголовно-правовых и криминалистических исследований. Тезисы принимаются до 15 ноября.",
            "date": "2026-10-17",
            "isPinned": False,
            "author": "СНО Института права",
            "tag": "Наука"
        }
    ]

    curator_and_pinned = []
    if ann_path.exists():
        try:
            with open(ann_path, 'r', encoding='utf-8') as f:
                old_ann = json.load(f)
            for item in old_ann:
                if item.get('isPinned') or item.get('tag') in ('Куратор', 'Группа', 'Расписание', 'Наука') or not item.get('id', '').startswith('ann-isu-'):
                    curator_and_pinned.append(item)
        except Exception as e:
            print("Ошибка чтения существующих объявлений:", e)

    for b in base_defaults:
        if not any(x['id'] == b['id'] for x in curator_and_pinned):
            curator_and_pinned.append(b)

    # Исключаем дубликаты
    seen_ids = set()
    combined_ann = []

    for it in curator_and_pinned:
        if it['id'] not in seen_ids:
            seen_ids.add(it['id'])
            combined_ann.append(it)

    for it in ann_entries:
        if it['id'] not in seen_ids:
            seen_ids.add(it['id'])
            combined_ann.append(it)

    with open(ann_path, 'w', encoding='utf-8') as f:
        json.dump(combined_ann, f, ensure_ascii=False, indent=2)
    print(f"Объявления ({len(combined_ann)} шт.) успешно сохранены в {ann_path}.")

    public_ann = root_dir / 'public' / 'data' / 'announcements.json'
    public_ann.parent.mkdir(parents=True, exist_ok=True)
    with open(public_ann, 'w', encoding='utf-8') as f:
        json.dump(combined_ann, f, ensure_ascii=False, indent=2)

    return True

if __name__ == '__main__':
    target = None
    force = False
    for arg in sys.argv[1:]:
        if arg in ('--force', '-f'):
            force = True
        elif arg.isdigit():
            target = int(arg)
    sync_all(target, force=force)
