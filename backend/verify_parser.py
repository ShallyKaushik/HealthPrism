
import fitz
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from report_parser import analyze_report

def create_mock_pdf(filename):
    doc = fitz.open()
    page = doc.new_page()
    text = """
    MEDICAL TEST REPORT
    -------------------
    Patient Name: John Doe
    Date: 2026-03-14
    
    AGE: 45
    RESTING BLOOD PRESSURE: 130 mmHg
    CHOLESTEROL: 210 mg/dL
    MAX HEART RATE: 165 bpm
    ST DEPRESSION (OLDPEAK): 1.5
    CHEST PAIN TYPE (CP): 2
    MAJOR VESSELS (CA): 0
    THAL: 2
    """
    page.insert_text((50, 50), text)
    doc.save(filename)
    doc.close()

if __name__ == "__main__":
    pdf_path = "test_report.pdf"
    create_mock_pdf(pdf_path)
    print(f"Created mock PDF: {pdf_path}")
    
    results = analyze_report(pdf_path)
    print("\nExtracted Results:")
    for key, val in results.items():
        print(f"{key}: {val}")
    
    # Clean up
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
