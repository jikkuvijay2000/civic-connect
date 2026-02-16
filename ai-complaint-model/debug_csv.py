import pandas as pd
import sys

try:
    with open("debug_output.txt", "w", encoding="utf-8") as f:
        df = pd.read_csv("data/complaints.csv")
        f.write(f"Total rows: {len(df)}\n")
        
        # Check raw sample
        sample = df['department'].iloc[0]
        f.write(f"Sample raw (row 0): {repr(sample)}\n")
        
        valid_departments = ["Fire Department", "Water Department", "Public Works Department", "Cleaning Department", "Electricity Department"]
        
        # Check stripping
        df["department_stripped"] = df["department"].str.strip()
        bad = df[~df["department_stripped"].isin(valid_departments)]
        
        f.write(f"Bad rows count (after strip): {len(bad)}\n")
        
        if not bad.empty:
            f.write("First 10 bad rows details:\n")
            for idx, row in bad.head(10).iterrows():
                f.write(f"Row {idx}:\n")
                f.write(f"  Text: {str(row['text'])[:50]}...\n")
                f.write(f"  Dept Raw: {repr(row['department'])}\n")
                f.write(f"  Prio: {row['priority']}\n")
                f.write("-" * 20 + "\n")
                
        # Value counts for department
        f.write("\nDepartment Value Counts:\n")
        f.write(str(df['department'].value_counts().head(20)))

except Exception as e:
    with open("debug_output.txt", "w") as f:
        f.write(f"Error: {e}")
