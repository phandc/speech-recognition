import librosa
import numpy as np
import os
import math
from sklearn.cluster import KMeans
import hmmlearn.hmm
import pickle


def get_mfcc(file_path):
    y, sr = librosa.load(file_path) # read .wav file
    hop_length = math.floor(sr*0.010) # 10ms hop
    win_length = math.floor(sr*0.025) # 25ms frame

    # mfcc is 12 x T matrix with 12 MFCCs returns

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

if __name__ == "__main__":
    class_names = ["thông","tin","dịch","bệnh","covid","test_thông","test_tin", "test_dịch","test_bệnh","test_covid",]
    dataset = {}
    for cname in class_names:
        print(f"Load {cname} dataset")
        dataset[cname] = get_class_data(os.path.join("training_data", cname))

    # Get all vectors in the datasets
    all_vectors = np.concatenate([np.concatenate(v, axis=0) for k, v in dataset.items()], axis=0)
    print("vectors", all_vectors.shape)
    # Run K-Means algorithm to get clusters
    kmeans = clustering(all_vectors)
    print("centers", kmeans.cluster_centers_.shape)

    #save kmeans models
    with open("kmeans.pkl", "wb") as f:
        pickle.dump(kmeans, f)

    models = {}
    for cname in class_names:
        class_vectors = dataset[cname]
        dataset[cname] = list([kmeans.predict(v).reshape(-1,1) for v in dataset[cname]])
        hmm = hmmlearn.hmm.MultinomialHMM(
            n_components=6, random_state=0, n_iter=1000, verbose=True,
            startprob_prior=np.array([0.7,0.2,0.1,0.0,0.0,0.0]),
            transmat_prior=np.array([
                [0.1,0.5,0.1,0.1,0.1,0.1,],
                [0.1,0.1,0.5,0.1,0.1,0.1,],
                [0.1,0.1,0.1,0.5,0.1,0.1,],
                [0.1,0.1,0.1,0.1,0.5,0.1,],
                [0.1,0.1,0.1,0.1,0.1,0.5,],
                [0.1,0.1,0.1,0.1,0.1,0.5,],
            ]),
        )
        if cname[:4] != 'test':
            X = np.concatenate(dataset[cname])
            lengths = list([len(x) for x in dataset[cname]])
            print("training class", cname)
            hmm.fit(X, lengths=lengths)
            models[cname] = hmm
    print("Training done")


    score_count = 0

    print("Testing")
    for true_cname in class_names:
        label = true_cname[5:]
        if true_cname[:4] != 'test':
            continue
        else :
          print("Testing ", label , " dataset ...")
          for O in dataset[true_cname]:
            score = {cname : np.exp(model.score(O, [len(O)])) for cname, model in models.items() if cname[:4] != 'test'}  #np.exp(model.score(O, [len(O)]) chuyen đôi ve khoang [0,1] vi score tra ve gia tri log cua sx
            # print(true_cname, score)
            predict = max(score, key=score.get)

            print("Test on true label ", label, ": predict result label is ", predict)

            if predict == label:
                score_count += 1

        print("Final recognition rate is %.2f" % (100.0 * score_count / len(dataset[true_cname])), "%")

        score_count = 0



        # # save model
        with open("model.pkl", "wb") as f:
            pickle.dump(models, f)



