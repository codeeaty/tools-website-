from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class TextRequest(BaseModel):
    text: str
    case_type: str

def to_title_case(text: str) -> str:
    return " ".join(word.capitalize() for word in text.split())

def to_camel_case(text: str) -> str:
    words = text.split()
    if not words:
        return ""
    return words[0].lower() + "".join(w.capitalize() for w in words[1:])

def to_pascal_case(text: str) -> str:
    return "".join(w.capitalize() for w in text.split())

def to_snake_case(text: str) -> str:
    return "_".join(text.split()).lower()

def to_kebab_case(text: str) -> str:
    return "-".join(text.split()).lower()

CASE_FUNCS = {
    "upper": str.upper,
    "lower": str.lower,
    "title": to_title_case,
    "camel": to_camel_case,
    "pascal": to_pascal_case,
    "snake": to_snake_case,
    "kebab": to_kebab_case,
}

@router.post("/text/convert")
def convert_case(req: TextRequest):
    func = CASE_FUNCS.get(req.case_type)
    if not func:
        return {"error": "Invalid case_type"}
    return {"result": func(req.text)}




from collections import Counter
import re


class TextRequest(BaseModel):
    text: str

STOP_WORDS = {
    "the","a","an","is","it","to","of","and","in","on","for","with","as",
    "that","this","at","by","be","are","was","were","or","but","not","i",
    "you","he","she","they","we","my","your","his","her","their","our"
}

def count_sentences(text: str) -> int:
    sentences = re.split(r'[.!?]+', text)
    return len([s for s in sentences if s.strip()])

def count_paragraphs(text: str) -> int:
    paras = [p for p in text.split('\n') if p.strip()]
    return len(paras) if paras else (1 if text.strip() else 0)

def longest_word(words: list[str]) -> str:
    return max(words, key=len) if words else ""

def avg_word_length(words: list[str]) -> float:
    if not words:
        return 0.0
    return round(sum(len(w) for w in words) / len(words), 2)

def keyword_density(words: list[str], top_n: int = 5) -> list[dict]:
    cleaned = [w.lower() for w in words if w.lower() not in STOP_WORDS and len(w) > 2]
    if not cleaned:
        return []
    counts = Counter(cleaned)
    total = len(cleaned)
    return [
        {"word": word, "count": count, "density": round((count / total) * 100, 1)}
        for word, count in counts.most_common(top_n)
    ]

@router.post("/text/word-count")
def word_count(req: TextRequest):
    text = req.text
    words = re.findall(r"[A-Za-z0-9']+", text)
    chars = len(text)
    chars_no_space = len(text.replace(" ", "").replace("\n", ""))
    word_total = len(words)
    sentence_total = count_sentences(text)
    paragraph_total = count_paragraphs(text)

    reading_seconds = (word_total / 200) * 60   # avg 200 wpm
    speaking_seconds = (word_total / 130) * 60  # avg 130 wpm

    return {
        "characters": chars,
        "characters_no_space": chars_no_space,
        "words": word_total,
        "sentences": sentence_total,
        "paragraphs": paragraph_total,
        "avg_word_length": avg_word_length(words),
        "longest_word": longest_word(words),
        "reading_time_seconds": round(reading_seconds),
        "speaking_time_seconds": round(speaking_seconds),
        "keyword_density": keyword_density(words),
    }



from difflib import SequenceMatcher
import re
import json


class CompareRequest(BaseModel):
    text: str
    reference: str

class MultiCompareRequest(BaseModel):
    text: str
    references: list[str]

def split_sentences(text: str) -> list[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]

def similarity_ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def find_matches(source_sentences: list[str], ref_sentences: list[str], threshold: float = 0.6):
    matches = []
    for s_idx, s in enumerate(source_sentences):
        best_score = 0.0
        best_ref = ""
        best_ref_idx = -1
        for r_idx, r in enumerate(ref_sentences):
            score = similarity_ratio(s, r)
            if score > best_score:
                best_score = score
                best_ref = r
                best_ref_idx = r_idx
        if best_score >= threshold:
            matches.append({
                "sentence_index": s_idx,
                "sentence": s,
                "matched_with": best_ref,
                "matched_ref_index": best_ref_idx,
                "similarity": round(best_score * 100, 1),
            })
    return matches

@router.post("/text/plagiarism-check")
def check_plagiarism(req: CompareRequest):
    source_sentences = split_sentences(req.text)
    ref_sentences = split_sentences(req.reference)

    if not source_sentences:
        return {"error": "No text provided to check."}
    if not ref_sentences:
        return {"error": "No reference text provided."}

    matches = find_matches(source_sentences, ref_sentences)
    overall_similarity = similarity_ratio(req.text, req.reference)

    flagged_count = len(matches)
    total_sentences = len(source_sentences)
    plagiarism_score = round((flagged_count / total_sentences) * 100, 1) if total_sentences else 0.0

    return {
        "overall_similarity": round(overall_similarity * 100, 1),
        "plagiarism_score": plagiarism_score,
        "total_sentences": total_sentences,
        "flagged_sentences": flagged_count,
        "matches": matches,
    }

@router.post("/text/plagiarism-check-multi")
def check_plagiarism_multi(req: MultiCompareRequest):
    source_sentences = split_sentences(req.text)
    if not source_sentences:
        return {"error": "No text provided to check."}
    if not req.references:
        return {"error": "No reference texts provided."}

    all_matches = []
    for ref_idx, ref_text in enumerate(req.references):
        ref_sentences = split_sentences(ref_text)
        matches = find_matches(source_sentences, ref_sentences)
        for m in matches:
            m["source_label"] = f"Reference {ref_idx + 1}"
        all_matches.extend(matches)

    best_by_sentence = {}
    for m in all_matches:
        idx = m["sentence_index"]
        if idx not in best_by_sentence or m["similarity"] > best_by_sentence[idx]["similarity"]:
            best_by_sentence[idx] = m

    final_matches = sorted(best_by_sentence.values(), key=lambda x: x["sentence_index"])
    total_sentences = len(source_sentences)
    flagged_count = len(final_matches)
    plagiarism_score = round((flagged_count / total_sentences) * 100, 1) if total_sentences else 0.0

    return {
        "plagiarism_score": plagiarism_score,
        "total_sentences": total_sentences,
        "flagged_sentences": flagged_count,
        "matches": final_matches,
    }



from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import markdown as md_lib




class MarkdownRequest(BaseModel):
    text: str
    mode: str = "html"  # "html" | "strip" | "preview"


def strip_markdown(text: str) -> str:
    text = re.sub(r'(\*\*|__)(.*?)\1', r'\2', text)
    text = re.sub(r'(\*|_)(.*?)\1', r'\2', text)
    text = re.sub(r'`{1,3}([^`]*)`{1,3}', r'\1', text)
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'>\s?', '', text)
    return text.strip()


@router.post("/markdowneditor")
async def convert_markdown(payload: MarkdownRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text field cannot be empty.")

    try:
        if payload.mode == "html" or payload.mode == "preview":
            result = md_lib.markdown(
                payload.text,
                extensions=["fenced_code", "tables", "nl2br", "sane_lists"]
            )
        elif payload.mode == "strip":
            result = strip_markdown(payload.text)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported mode: {payload.mode}")

        return {"result": result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    





class JsonRequest(BaseModel):
    text: str
    mode: str = "format"  # "format" | "minify" | "validate" | "sort_keys"


@router.post("/jsonformater")
async def convert_json(payload: JsonRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text field cannot be empty.")

    try:
        parsed = json.loads(payload.text)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON: {e.msg} (line {e.lineno}, column {e.colno})"
        )

    try:
        if payload.mode == "format":
            result = json.dumps(parsed, indent=2)
        elif payload.mode == "minify":
            result = json.dumps(parsed, separators=(",", ":"))
        elif payload.mode == "sort_keys":
            result = json.dumps(parsed, indent=2, sort_keys=True)
        elif payload.mode == "validate":
            result = "✓ Valid JSON"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported mode: {payload.mode}")

        return {"result": result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))