# train_model.py
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pickle
import os

df = pd.read_csv("dataset/merged_dataset.csv")

X = df.drop("label", axis=1).values
y = df["label"].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Training model...")
model = RandomForestClassifier(
    n_estimators=60,
    max_depth=20,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

print("\nTree statistics:")
for i, tree in enumerate(model.estimators_[:5]):
    print(f"Tree {i}: {tree.tree_.node_count} nodes")

y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)

print(f"\n✅ Accuracy: {acc:.2%}\n")
print("Detailed report:")
print(classification_report(y_test, y_pred))

os.makedirs("model", exist_ok=True)
with open("model/sign_model.pkl", "wb") as f:
    pickle.dump(model, f)

    size_mb = os.path.getsize("model/sign_model.pkl") / (1024 * 1024)
print(f"\nModel size: {size_mb:.2f} MB")

print("✅ Model saved to model/sign_model.pkl")