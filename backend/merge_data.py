import pandas as pd
import glob
import os

files = glob.glob("dataset/*.csv")

if not files:
    print("No CSV files found in dataset/ folder")
    exit()

dfs = []
for f in files:
    df = pd.read_csv(f)
    dfs.append(df)
    print(f"Loaded {f}: {len(df)} samples")

merged = pd.concat(dfs, ignore_index=True)
merged.to_csv("dataset/merged_dataset.csv", index=False)

print(f"\nMerged dataset saved: dataset/merged_dataset.csv")
print(f"Total samples: {len(merged)}")
print(f"\nSamples per label:")
print(merged["label"].value_counts())