import pandas as pd
from datasets import Dataset
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification, Trainer, TrainingArguments
from sklearn.preprocessing import LabelEncoder
import torch
import os
import json
import numpy as np
import evaluate

# Load dataset
df = pd.read_csv("data/complaints.csv", index_col=False)

# Combine labels into single output
df["label"] = df["department"] + " | " + df["priority"]

# Encode labels
label_encoder = LabelEncoder()
df["label_encoded"] = label_encoder.fit_transform(df["label"])

# Save label mapping
os.makedirs("model", exist_ok=True)
with open("model/label_mapping.json", "w") as f:
    json.dump(dict(enumerate(label_encoder.classes_)), f)

# Convert to HuggingFace dataset
dataset = Dataset.from_pandas(df[["text", "label_encoded"]])

# Split
dataset = dataset.train_test_split(test_size=0.2)

# Tokenizer
tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")

def tokenize(batch):
    return tokenizer(batch["text"], padding=True, truncation=True)

dataset = dataset.map(tokenize, batched=True)

dataset = dataset.rename_column("label_encoded", "labels")
dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

# Model
model = DistilBertForSequenceClassification.from_pretrained(
    "distilbert-base-uncased",
    num_labels=len(label_encoder.classes_)
)

# Metrics
accuracy_metric = evaluate.load("accuracy")
precision_metric = evaluate.load("precision")
recall_metric = evaluate.load("recall")
f1_metric = evaluate.load("f1")

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=1)

    accuracy = accuracy_metric.compute(predictions=predictions, references=labels)
    precision = precision_metric.compute(predictions=predictions, references=labels, average="weighted")
    recall = recall_metric.compute(predictions=predictions, references=labels, average="weighted")
    f1 = f1_metric.compute(predictions=predictions, references=labels, average="weighted")

    return {
        "accuracy": accuracy["accuracy"],
        "precision": precision["precision"],
        "recall": recall["recall"],
        "f1": f1["f1"]
    }

# Training args
training_args = TrainingArguments(
    output_dir="model",
    num_train_epochs=4,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    logging_dir="./logs",
    logging_steps=10,
    save_strategy="epoch",
    eval_strategy="epoch"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
    compute_metrics=compute_metrics
)

# Train
trainer.train()

# Final evaluation
results = trainer.evaluate()

print("\nFinal Evaluation Results:")
for key, value in results.items():
    print(f"{key}: {value}")

# Save metrics to file (for report)
with open("model/metrics.txt", "w") as f:
    for key, value in results.items():
        f.write(f"{key}: {value}\n")

# Save model
trainer.save_model("model")
tokenizer.save_pretrained("model")

print("\nTraining complete. Model saved in /model")
