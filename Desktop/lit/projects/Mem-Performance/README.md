# Memory Performance Prediction Model

## Overview

This project uses a neural network (ANN) to predict memory retention scores based on study habits. The dataset contains features like:
- **TimeSinceStudy**: The number of days since a student last studied.
- **Repetitions**: The number of repetitions of the study material.
- **StudyTime**: The time spent studying in minutes.
- **Difficulty**: The difficulty level of the study material (categorical: Easy, Medium, Hard).

The goal of this project is to predict the **RetentionScore** based on these features using an Artificial Neural Network.

## Dataset

The dataset is synthetically generated and includes the following features:
- `TimeSinceStudy`: Number of days since the student last studied.
- `Repetitions`: Number of repetitions of study material.
- `StudyTime`: Time spent studying (in minutes).
- `Difficulty`: Categorical variable for the difficulty of the material.
- `RetentionScore`: Target variable indicating the retention score (0-100).

The dataset is generated in `dataset.py` and saved to a CSV file (`Memory_Performance.csv`).

## Files

- `dataset.py`: This script generates a synthetic dataset with the features mentioned above.
- `mem.py`: This script loads the dataset, preprocesses it, builds and trains the neural network model, and evaluates its performance.

## Installation

1. Clone the repository to your local machine:
```bash
git clone https://github.com/karadeskin/Mem-Performance.git
```

2. Navigate to the project folder:
```bash
cd Mem-Performance
```

3. Create and activate a virtual environment (optional but recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows
```

4. Install the required dependencies: 
```bash
pip install -r requirements.txt
```

## Usage

### Step 1: Generate the Dataset

Run `dataset.py` to generate the synthetic dataset:
```bash
python dataset.py
```

### Step 2: Train and Evaluate the Model 

Run mem.py to load the dataset, preprocess the data, and train the neural network model:
``` bash
python mem.py
```

## Model Evaluation 

The model’s performance is evaluated using Mean Squared Error (MSE) and R-squared metrics. The results are displayed in the terminal after running the script.

## Future Improvements 

* Add more advanced model architectures.
* Incorporate more features and real-world data.
* Experiment with hyperparameter tuning.

## Acknowledgements 
* TensorFlow and Keras for providing the neural network framework.
* scikit-learn for data preprocessing and model evaluation tools