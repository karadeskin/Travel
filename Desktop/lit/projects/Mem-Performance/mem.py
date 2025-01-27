#importing libraries
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_squared_error
import matplotlib.pyplot as plt

#part 1 - data preprocessing
#loading the dataset
dataset = pd.read_csv('Memory_Performance.csv')
#features represent the independent variables 
X = dataset.iloc[:, :-1].values 
#target represents the dependent variable
y = dataset.iloc[:, -1].values  
#encoding categorical data (difficulty level)
le = LabelEncoder()
#encoding 'difficulty' column 
X[:, 3] = le.fit_transform(X[:, 3])  
#splitting the dataset into the training set and test set
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)
#feature scaling
sc = StandardScaler()
X_train = sc.fit_transform(X_train)
X_test = sc.transform(X_test)

#part 2 - building the ANN
ann = tf.keras.models.Sequential()
#adding the input layer and hidden layers
ann.add(tf.keras.layers.Dense(units=6, activation='relu'))
ann.add(tf.keras.layers.Dense(units=6, activation='relu'))
#adding the output layer
ann.add(tf.keras.layers.Dense(units=1, activation='linear'))
#compiling the ANN
ann.compile(optimizer='adam', loss='mean_squared_error')
#training the ANN on the training set
ann.fit(X_train, y_train, batch_size=32, epochs=100)

#part 3 - making predictions and evaluating the model
#predicting the test set results
y_pred = ann.predict(X_test)
#evaluating the model
mse = mean_squared_error(y_test, y_pred)
print(f"Mean Squared Error: {mse}")

#part 4 - visualizing the results
plt.scatter(y_test, y_pred)
plt.xlabel('Actual Retention Score')
plt.ylabel('Predicted Retention Score')
plt.title('Actual vs Predicted Retention Scores')
plt.show()