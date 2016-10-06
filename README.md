# Sorting out the HN's Who's is hiring mess

Basically I wrote the code that parses HN's Who Is Hiring page, selects all the job positions, passes them through the Google Natural Language API in order to recognize the location entities(see https://cloud.google.com/natural-language/docs/basics), then builds the static html that shows the locations and the attached jobs in a Google Map.
The result is in https://sabakumoff.github.io/pepper/10.16.html
