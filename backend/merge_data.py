import pandas as pd
import glob
import os

files = glob.glob("dataset/*.csv")

# Exclude the merged output file itself from being re-merged
files = [f for f in files if os.path.basename(f) != "merged_dataset.csv"]

if not files:
    print("⚠️ No CSV files found in dataset/ folder")
    exit()

dfs = []
for f in files:
    df = pd.read_csv(f)
    dfs.append(df)
    print(f"Loaded {f}: {len(df)} samples")

merged = pd.concat(dfs, ignore_index=True)
merged.to_csv("dataset/merged_dataset.csv", index=False)

print(f"\n✅ Merged dataset saved: dataset/merged_dataset.csv")
print(f"Total samples: {len(merged)}")
print(f"\nSamples per label:")
print(merged["label"].value_counts())