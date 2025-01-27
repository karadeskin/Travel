#importing libraries 
import numpy as np
import pandas as pd

#generating synthetic memory performance data
np.random.seed(42)
n_samples = 1000
#days since study
TimeSinceStudy = np.random.randint(1, 30, n_samples)  
#number of repitions 
Repetitions = np.random.randint(1, 10, n_samples)     
#minutes spent studying
StudyTime = np.random.randint(10, 120, n_samples)     
Difficulty = np.random.choice(['Easy', 'Medium', 'Hard'], n_samples)
#creating the target variable (retention score)
RetentionScore = 100 - (TimeSinceStudy * 2) + (Repetitions * 5) - (StudyTime * 0.1)
#ensure scores are between 0 and 100
RetentionScore = np.clip(RetentionScore, 0, 100)  
#creating a dataframe
data = pd.DataFrame({
    'TimeSinceStudy': TimeSinceStudy,
    'Repetitions': Repetitions,
    'StudyTime': StudyTime,
    'Difficulty': Difficulty,
    'RetentionScore': RetentionScore
})
#saving the dataset to a CSV
data.to_csv('Memory_Performance.csv', index=False)
print(data.head())