
import pickle
import librosa
import os
import math
from sklearn.cluster import KMeans
import numpy as np
from pydub import AudioSegment
from pydub.silence import split_on_silence
from function import  get_class_data, get_mfcc, clustering, split_word
models = {} # scores is an empty dict already
model_target = "model/model.pkl"
kmeans_target = "model/kmeans.pkl"

def predict(model_target, kmeans_target):

        split_word()
        #a fix function for spliting word for voice recoginition
        #The recording need to be a bit slow
        # there should be silence gap between the words
        # for effective performance
        # the wav file will be store in folder user_data

        dataset = {}
        scores = []

        #extract mfcc of word
        dataset["user_data"] = get_class_data("user_data")

        # storing predicted word into an arr, then print it and merge into a sentences
        predict_res = []

        if os.path.getsize(model_target) > 0:
            with open(model_target, "rb") as f:
                models = pickle.load(f)
                # print(models)

        if os.path.getsize(kmeans_target) > 0:
            with open(kmeans_target, "rb") as f:
                kmeans = pickle.load(f)

                dataset["user_data"] = list([kmeans.predict(v).reshape(-1, 1) for v in dataset["user_data"]])

        for O in dataset["user_data"]:
            score = {cname: np.exp(model.score(O, [len(O)])) for cname, model in
                     models.items()}
            # np.exp(model.score(O, [len(O)]) chuyen đôi ve khoang [0,1] vi score tra ve gia tri log cua sx
            # print(score)
            predict = max(score, key=score.get) #get best prediction

            max_score = max(score.values())
            # print(max_score)
            scores.append(max_score)

            print("predict result label is ", predict)

            predict_res.append(predict)

        sentence = " ".join(predict_res) #from predicted words to sentences
        return (sentence, scores)

# basically attempt to load many model and get result with best performance base on score
def combine_predict():

    s1, scores1 = predict('model/model.pkl', 'model/kmeans.pkl')
    print(s1)
    for s in scores1:
        print(s, end=" ")
    print("\n")
    s2, scores2 = predict('model/model_s3.pkl', 'model/kmeans_s3.pkl')
    print(s2)
    for s in scores2:
        print(s, end=" ")
    print("\n")
    count1 = 0
    for (i, j) in zip(scores1, scores2): #to do: compare result of 2 models
        if i > j:
            count1 = count1 + 1

    if count1 > (len(scores1) / 2): #to do: get the model has higher score to thresh hold
        return s1
    else:
        return s2

