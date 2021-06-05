
import pickle
import librosa
import os
import math
from sklearn.cluster import KMeans
import numpy as np
from pydub import AudioSegment
from pydub.silence import split_on_silence
from function import  get_class_data, get_mfcc, clustering
models = {} # scores is an empty dict already
model_target = "model/model.pkl"
kmeans_target = "model/kmeans.pkl"

def split_word():

    for f in os.listdir("user_data"): #clean training_data
        os.remove(os.path.join("user_data", f))

    file_name = ""
    for f in os.listdir("upload"):  #to do: only loop one time to get filename
           file_name = f

    sound_file = AudioSegment.from_wav(os.path.join("upload", file_name))
    # print(detect_silence(sound_file))

    dBFS = sound_file.dBFS
    chunks = split_on_silence(sound_file,
        # must be silent for at least half a second
        min_silence_len=100,

        # consider it silent if quieter than -16 dBFS
        silence_thresh=dBFS-16,
    )

    for i, chunk in enumerate(chunks):

        out_file = "user_data/chunk{0}.wav".format(i)
        print("exporting", out_file)
        chunk.export(out_file, format="wav")


def get_mfcc(file_path):
    y, sr = librosa.load(file_path) # read .wav file
    hop_length = math.floor(sr*0.010) # 10ms hop
    win_length = math.floor(sr*0.025) # 25ms frame
    # mfcc is 12 x T matrix
    mfcc = librosa.feature.mfcc(
        y, sr, n_mfcc=12, n_fft=1024,
        hop_length=hop_length, win_length=win_length)
    # substract mean from mfcc --> normalize mfcc
    mfcc = mfcc - np.mean(mfcc, axis=1).reshape((-1,1))
    # delta feature 1st order and 2nd order
    delta1 = librosa.feature.delta(mfcc, order=1, mode='nearest')
    delta2 = librosa.feature.delta(mfcc, order=2, mode='nearest')
    # X is 36 x T
    X = np.concatenate([mfcc, delta1, delta2], axis=0) # O^r
    # return T x 36 (transpose of X)
    return X.T # hmmlearn use T x N matrix

def get_class_data(data_dir):
    files = os.listdir(data_dir)
    mfcc = [get_mfcc(os.path.join(data_dir,f)) for f in files if f.endswith(".wav")]
    return mfcc

def clustering(X, n_clusters=28):
    kmeans = KMeans(n_clusters=n_clusters, n_init=50, random_state=0, verbose=0)
    kmeans.fit(X)
    print("centers", kmeans.cluster_centers_.shape)
    return kmeans


def predict(model_target, kmeans_target):

        split_word()

        dataset = {}
        scores = []

        dataset["user_data"] = get_class_data("user_data")

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
                     models.items()}  # np.exp(model.score(O, [len(O)]) chuyen đôi ve khoang [0,1] vi score tra ve gia tri log cua sx
            # print(score)
            predict = max(score, key=score.get)

            max_score = max(score.values())
            # print(max_score)
            scores.append(max_score);

            print("predict result label is ", predict)

            predict_res.append(predict)

        sentence = " ".join(predict_res)
        return (sentence, scores)




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

