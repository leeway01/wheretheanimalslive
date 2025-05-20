from fastapi import FastAPI, Query
import json
from typing import Optional

app = FastAPI()

# ✅ 데이터 로드 함수
def load_json(file_path):
    with open(file_path, encoding="utf-8") as f:
        return json.load(f)

# ✅ 동물 데이터 및 번역 데이터 로드
animals_data = load_json("data/animals.json")
locales_data = {
    "ko": load_json("locales/ko.json"),
    "en": load_json("locales/en.json"),
}

# ✅ 특정 국가의 동물 목록 반환
@app.get("/animals/{country}")
def get_animals_by_country(country: str):
    country_animals = next((c for c in animals_data if c["country"] == country), None)
    if country_animals:
        return {"country": country, "animals": country_animals["animals"]}
    return {"message": "해당 국가의 동물 데이터를 찾을 수 없습니다."}

# ✅ 언어별 번역 데이터 반환
@app.get("/locales/{lang}")
def get_locale_data(lang: str):
    return locales_data.get(lang, {"message": "지원되지 않는 언어입니다."})

# ✅ 동물 검색 기능
@app.get("/search")
def search_animals(
    query: str = Query(..., title="검색어"),
    lang: Optional[str] = "ko"
):
    results = []
    for country_data in animals_data:
        for animal in country_data["animals"]:
            animal_name = animal["name"]
            if query.lower() in animal_name.lower():
                results.append(animal)

    if not results:
        return {"message": "검색 결과가 없습니다."}

    return {"results": results}

# ✅ 새로운 동물 데이터를 추가하는 엔드포인트 (관리자용)
@app.post("/update-animals")
def update_animals(new_data: dict):
    animals_data.append(new_data)
    with open("data/animals.json", "w", encoding="utf-8") as f:
        json.dump(animals_data, f, ensure_ascii=False, indent=4)
    return {"message": "동물 데이터가 업데이트되었습니다!"}

# ✅ 서버 실행 명령어 (터미널에서 실행)
# uvicorn server:app --host 0.0.0.0 --port 8000 --reload
