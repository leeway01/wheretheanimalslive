import json
import requests
import re
import os
import openai  # OpenAI 라이브러리 임포트

# === 설정 ===
openai.api_key = "gpt-key"

countries = [
    "Afghanistan",
    "Albania", "Algeria", "Angola", "Antarctica", "Argentina", "Armenia",
    "Australia", "Austria", "Azerbaijan", "Bangladesh", "Belarus", "Belgium", "Belize",
    "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
    "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon",
    "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Costa Rica",
    "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo",
    "Denmark", "Djibouti", "Dominican Republic", "East Timor", "Ecuador", "Egypt",
    "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Falkland Islands",
    "Fiji", "Finland", "France", "French Guiana", "French Southern and Antarctic Lands", "Gabon",
    "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Greenland", "Guatemala", "Guinea",
    "Guinea Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India",
    "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica",
    "Japan", "Jordan", "Kazakhstan", "Kenya", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos",
    "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Lithuania", "Luxembourg",
    "Macedonia", "Madagascar", "Malawi", "Malaysia", "Mali", "Malta", "Mauritania",
    "Mexico", "Moldova", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nepal", "Netherlands", "New Caledonia", "New Zealand", "Nicaragua",
    "Niger", "Nigeria", "North Korea", "Northern Cyprus", "Norway", "Oman", "Pakistan",
    "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Puerto Rico", "Qatar", "Republic of Serbia", "Republic of the Congo", "Romania", "Russia",
    "Rwanda", "Saudi Arabia", "Senegal", "Sierra Leone", "Slovakia", "Slovenia",
    "Solomon Islands", "Somalia", "Somaliland", "South Africa", "South Korea", "South Sudan",
    "Spain", "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland",
    "Syria", "Taiwan", "Tajikistan", "Thailand", "The Bahamas", "Togo", "Trinidad and Tobago",
    "Tunisia", "Turkey", "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates",
    "United Kingdom", "United Republic of Tanzania", "United States of America", "Uruguay",
    "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "West Bank", "Western Sahara",
    "Yemen", "Zambia", "Zimbabwe"
]

API_URL = "https://en.wikipedia.org/w/api.php"

# 공통 위키 요청

def wiki_request(params):
    params['format'] = 'json'
    res = requests.get(API_URL, params=params)
    return res.json().get('query', {})

# GPT를 이용한 번역 함수 (영어->한국어)

def translate_to_korean(text):
    if not text:
        return ''
    resp = openai.ChatCompletion.create(
        model="gpt-4o",  # 또는 원하는 모델
        messages=[
            {"role": "system", "content": "Please translate the following English text to Korean, preserving structure for TTS synchronization."},
            {"role": "user", "content": text}
        ]
    )
    return resp.choices[0].message.content.strip()

# 1) 카테고리 멤버 조회

def get_category_members(country, base_category, limit=20):
    q = wiki_request({
        'action': 'query',
        'list': 'categorymembers',
        'cmtitle': f"Category:{base_category} of {country}",
        'cmlimit': limit,
        'cmnamespace': 0
    })
    return q.get('categorymembers', [])

# 2) 페이지 인포박스 썸네일 이미지 fetch

def fetch_infobox_image(title):
    q = wiki_request({
        'action': 'query',
        'prop': 'pageimages',
        'titles': title,
        'pithumbsize': 250
    })
    for page in q.get('pages', {}).values():
        return page.get('thumbnail', {}).get('source')
    return None

# 3) 영어 요약 추출

def fetch_page_extract(title, sentences=2):
    q = wiki_request({
        'action': 'query',
        'prop': 'extracts',
        'exintro': True,
        'exsentences': sentences,
        'explaintext': True,
        'titles': title
    })
    for page in q.get('pages', {}).values():
        return page.get('extract', '')
    return ''

# 4) 한국어 위키 문서명 조회 (없으면 GPT 번역)

def fetch_korean_title(title):
    q = wiki_request({
        'action': 'query',
        'prop': 'langlinks',
        'titles': title,
        'lllang': 'ko',
        'lllimit': 1
    })
    for page in q.get('pages', {}).values():
        links = page.get('langlinks', [])
        if links:
            return links[0].get('*', '')
    return translate_to_korean(title)

# 5) 페이지 카테고리 목록 추출 (곤충 필터링용)

def fetch_page_categories(title):
    q = wiki_request({
        'action': 'query',
        'prop': 'categories',
        'titles': title,
        'cllimit': 'max'
    })
    cats = []
    for page in q.get('pages', {}).values():
        for c in page.get('categories', []):
            cats.append(c['title'])
    return cats

# 6) 이미지 저작권 정보 함수 (고정)

def fetch_image_copyright(image_url):
    # 모든 이미지는 Wikipedia를 출처로 표시
    return "Wikipedia"

# 7) 국가별 동물 정보 수집

def fetch_animals_for_country(country, limit=6):
    animals = []
    members = get_category_members(country, 'Fauna', limit=limit*3)
    if len(members) < limit:
        members += get_category_members(country, 'Animals', limit=limit*3)

    for member in members:
        title = member['title']
        # 카테고리 페이지 제외
        if title == f'Fauna of {country}':
            continue
        # 목록 페이지 제외
        if title.lower().startswith('list of'):
            continue
        img = fetch_infobox_image(title)
        if not img or 'location' in img.lower():
            continue
        # 페이지 카테고리에서 곤충(Insect) 항목 제외
        page_cats = fetch_page_categories(title)
        if any('insect' in cat.lower() for cat in page_cats):
            continue

        # 데이터 채우기
        en_name = title
        ko_name = fetch_korean_title(title)
        en_desc = fetch_page_extract(title)
        ko_desc = translate_to_korean(en_desc)
        copy = fetch_image_copyright(img)

        animal_id = re.sub(r'[^a-z0-9]', '_', title.lower())
        animals.append({
            'id': animal_id,
            'image': img,
            'name': {'en': en_name, 'ko': ko_name},
            'description': {'en': en_desc, 'ko': ko_desc},
            'copyright': copy
        })
        if len(animals) >= limit:
            break

    return animals

# 결과 생성 및 저장
output = []
for idx, country in enumerate(countries, start=1):
    print(f"Processing {idx}/{len(countries)}: {country}")
    data = fetch_animals_for_country(country)
    output.append({'country': country, 'animals': data})

output_path = 'app/data/output/animals_all_countries.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Generated {output_path}")