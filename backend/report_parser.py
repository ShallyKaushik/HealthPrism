
import fitz  # PyMuPDF
import re
import os

def extract_text_from_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def parse_metrics_from_text(text):
    """
    Improved heuristic parser to handle table-like layouts and OCR inaccuracies.
    """
    print(f"DEBUG: Parsing Raw Text:\n{text}\n" + "-"*20)
    
    metrics = {
        "age": None,
        "trestbps": None,
        "chol": None,
        "thalach": None,
        "oldpeak": None,
        "cp": None,
        "ca": None,
        "thal": None
    }

    # Clean text: remove extra spaces but keep line breaks
    lines = [line.strip() for line in text.split('\n') if line.strip()]

    def find_val(keyword_pattern, line, is_float=False):
        if re.search(keyword_pattern, line):
            # Look for numbers in the same line after the keyword
            nums = re.findall(r"(\d+(?:\.\d+)?)", line)
            if nums:
                try:
                    # Take the last number if there's more than one (often the value is after some ID or unit)
                    val = float(nums[-1]) if is_float or '.' in nums[-1] else int(nums[-1])
                    return val
                except: return None
        return None

    for line in lines:
        # Numeric values
        if metrics["age"] is None: metrics["age"] = find_val(r"(?i)age", line)
        if metrics["trestbps"] is None: metrics["trestbps"] = find_val(r"(?i)blood\s+pressure", line)
        if metrics["chol"] is None: metrics["chol"] = find_val(r"(?i)cholesterol", line)
        if metrics["thalach"] is None: metrics["thalach"] = find_val(r"(?i)(?:heart\s+rate|thalach)", line)
        if metrics["oldpeak"] is None: metrics["oldpeak"] = find_val(r"(?i)(?:oldpeak|ST\s+depression)", line, is_float=True)
        if metrics["ca"] is None: metrics["ca"] = find_val(r"(?i)(?:major\s+vessels|ca)", line)

        # Categorical: Chest Pain (CP)
        if metrics["cp"] is None and re.search(r"(?i)(?:chest\s+pain|cp)", line):
            l_line = line.lower()
            if "typical" in l_line: metrics["cp"] = 0
            elif "atypical" in l_line: metrics["cp"] = 1
            elif "non" in l_line: metrics["cp"] = 2
            elif "asymptomatic" in l_line: metrics["cp"] = 3
            else:
                num = find_val(r"(?i)(?:chest\s+pain|cp)", line)
                if num is not None: metrics["cp"] = int(num)

        # Categorical: Thal
        if metrics["thal"] is None and re.search(r"(?i)thal", line):
            l_line = line.lower()
            if "normal" in l_line: metrics["thal"] = 2
            elif "fixed" in l_line: metrics["thal"] = 1
            elif "reversible" in l_line: metrics["thal"] = 3
            else:
                num = find_val(r"(?i)thal", line)
                if num is not None: metrics["thal"] = int(num)

    # Sanity check for Oldpeak (often OCR reads 2.3 as 23)
    if metrics["oldpeak"] and metrics["oldpeak"] > 10:
        # If it's something like 23 and we expect 2.3
        metrics["oldpeak"] = metrics["oldpeak"] / 10.0

    print(f"DEBUG: Final Metrics: {metrics}")
    return metrics

def analyze_report(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    
    if ext == '.pdf':
        text = extract_text_from_pdf(file_path)
    elif ext in ['.jpg', '.jpeg', '.png']:
        try:
            import pytesseract
            from PIL import Image
            
            # Common Tesseract paths on Windows
            if os.name == 'nt':
                possible_paths = [
                    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                    r'C:\Users\\' + os.getlogin() + r'\AppData\Local\Tesseract-OCR\tesseract.exe'
                ]
                for p in possible_paths:
                    if os.path.exists(p):
                        pytesseract.pytesseract.tesseract_cmd = p
                        break

            # Try a simple call to verify tesseract is available
            try:
                pytesseract.get_tesseract_version()
            except:
                return {"error": "Tesseract-OCR not found. Please install it to use image analysis."}

            # --psm 6 is better for tabular data / sparse text
            text = pytesseract.image_to_string(Image.open(file_path), config='--psm 6')
        except Exception as e:
            return {"error": f"OCR Error: {str(e)}"}

    if not text.strip():
        return {"error": "No text could be extracted from the document."}

    return parse_metrics_from_text(text)
