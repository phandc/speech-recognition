import pickle
import librosa
import os
import math
from sklearn.cluster import KMeans
import numpy as np
from pydub import AudioSegment
from pydub.silence import split_on_silence

def split_word():

    for f in os.listdir("user_data"): #clean training_data
        os.remove(os.path.join("user_data", f))

    file_name = ""
    for f in os.listdir("upload"):  #to do: only loop one time to get filename
           file_name = f
    chunks = split_on_silence(sound_file,
        # must be silent for at least half a second
        min_silence_len=50,

        # consider it silent if quieter than -16 dBFS
        silence_thresh=dBFS-16,
    )

    for i, chunk in enumerate(chunks):

        out_file = "user_data/chunk{0}.wav".format(i)
        print("exporting", out_file)
        chunk.export(out_file, format="wav")

    # sound_file = AudioSegment.from_wav(os.path.join("upload", file_name))
    # print(detect_silence(sound_file))

    # dBFS = sound_file.dBFS
    # return dBFS

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
    #1st order: basic hmm one stage is predicted by previous states
    delta1 = librosa.feature.delta(mfcc, order=1, mode='nearest')
    #2nd order: 1 stage is
    delta2 = librosa.feature.delta(mfcc, order=2, mode='nearest')
    # X is 36 x T
    X = np.concatenate([mfcc, delta1, delta2], axis=0) # O^r
    # return T x 36 (transpose of X)
    return X.T # hmmlearn use T x N matrix
#
def get_class_data(data_dir):
    files = os.listdir(data_dir)
    mfcc = [get_mfcc(os.path.join(data_dir,f)) for f in files if f.endswith(".wav")]
    return mfcc

def clustering(X, n_clusters=28):
    kmeans = KMeans(n_clusters=n_clusters, n_init=50, random_state=0, verbose=0)
    kmeans.fit(X)
    print("centers", kmeans.cluster_centers_.shape)
    return kmeans

