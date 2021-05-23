from flask import Flask, render_template, request
from werkzeug.utils import secure_filename
import os, os.path


UPLOAD_FOLDER = 'upload'

app = Flask(__name__)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/', methods=['POST', 'GET'])
def hello_world():
    if request.method == "POST":
        f = request.files['audio_data']
        if len(f.filename) > 0:
            filename = secure_filename(f.filename)
            f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        print('file uploaded successfully')

        return render_template('index.html', request="POST")
    else:
        return render_template("index.html")


if __name__ == '__main__':
    app.run(debug=True, port=8080)
