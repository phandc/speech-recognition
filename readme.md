## Speech Recognition Web Application
```

Introduction: 
-The following project attempt to build a web based application to transfer speech to to text.
-It can translate some Vietnamese words to short phases.
-The model used for recognising is Hidden Markov Model
-Words recognised by model are some Vietnamese words from joint dataset.


Web app's basic user case:
-Voice recording 
-Delete record
-Convert record to text
-Download recorded text 



To lauch application, please command
   python app.py

For GMMHMM training
   python hmm.py
Note: Code is a bit rusty. For custom training, make sure changing data path in hmm.py file

To gather word data with annotated srt:
    python word_processing.py
This is somewhat effective 

```
