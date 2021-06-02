from flask import Flask, render_template, request
from werkzeug.utils import secure_filename
import os, os.path
from utils import predict

UPLOAD_FOLDER = 'upload'

app = Flask(__name__)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER




@app.route('/', methods=['POST', 'GET'])
def hello_world():
    if request.method == "POST":

        for f in os.listdir("upload"): #always remove before post
            os.remove(os.path.join("upload", f))

        f = request.files['audio_data']
        if len(f.filename) > 0:
            filename = secure_filename(f.filename)
            f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        print('file uploaded successfully')

        sentence = predict()
        print("=====================>")
        print(sentence)

        return sentence
    else:
        return render_template("index.html")


if __name__ == '__main__':
    app.run(debug=True, port=8080)

