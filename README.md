# Sorting out the HN's Who's is hiring mess

Basically I wrote the code that parses HN's Who Is Hiring page, selects all the job positions, passes them through the Google Natural Language API in order to recognize the location entities(see https://cloud.google.com/natural-language/docs/basics), then builds the static html that shows the locations and the attached jobs in a Google Map.
The result is in https://sabakumoff.github.io/pepper/10.16.html

The recognition of location entities is not accurate in some cases. For example if a text like 
"Blockai | San Francisco, CA | CV/ML and Front-end Engineers - https://blockai.com"
(from https://news.ycombinator.com/item?id=12631335) is passed to Google Natural Language API then it returns the following "locations": San Francisco, CA, ML, CV. 
![alt text](https://github.com/sAbakumoff/hn-sort-out/blob/master/LangAnalytics.PNG)
However, ML stands for "Machine Learning" and CV is "Computer Vision"! Perhaps the algorithm concludes that CV/ML is the location because it's close to other locations(San Francisco, CA).

I'be been working on improving the results interpretations.
