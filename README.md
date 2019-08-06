# carly-sheets
This is a tool for generating Monte Carlo simulations from estimates in Google Sheets.

## Getting Started

You need a Google Sheet with a column containing estimates, and a column containing standard deviation values corresponding to each estimate. For instance:

```
    ---------------------
    |    A     |   B    |
-------------------------
| 1 | Estimate | StdDev |
-------------------------
| 2 |        8 |    4   |
| 3 |        5 |    1   |
| 4 |        3 |    0.5 |
| 5 |       13 |    2   |
| 6 |        2 |    0.5 |
-------------------------
```

You must also have [NodeJS](https://nodejs.org/en/download/) installed. Once installed, you can run `carly-sheets` from the command line via:

```
npx github:asemio/carly-sheets
```

*Note: The first time you run `carly-sheets` there will be a few extra steps to set up the authentication credentials to allow you to access Google Sheets from the command line.*

`carly-sheets` will prompt you for a few pieces of information:

* `sheet` The ID of the google sheet. This will be a string of letters and numbers in the URL of a Google Sheet:

![illustration of getting ID from sheet](https://help.form.io/assets/img/googlesheet/googlesheet-spreadsheet.png)

* `est`/`estimatesRange` The cell range of the estimates. For the estimates above (assuming they're in a sheet called `Estimates`), the range would be `Estimates!A2:A6`

* `stddev`/`StandardDeviationsRange` The cell range for the standard deviation values corresponding to each estimate. There should be exactly the same number of standard deviation values as estimates.

* `out`/`output` The topmost cell to place the simulated values. Bear in mind that there will be 1000 cells written in a column starting here, so be sure your spreadsheet can accommodate that.

For each of the above four values, you can also specify them on the command line; for instance:

```
npx github:asemio/carly-sheets --sheet 7624ZDFBDHsdfsadgDRYdfb345 --est Estimates!a2:a9 --stddev Estimates!c2:c9 --out Analysis!b2
```

You may also mix-and-match which arguments you type in interactively and which are passed as command-line arguments.


## The Math
Per [Mike Cohn](https://www.mountaingoatsoftware.com/blog/how-do-story-points-relate-to-hours/comments) (and others), an estimate can be treated as a statistical distribution for completion when projecting timelines. This project applies this concept to a set of estimates and their respective standard deviations to create a set of Monte Carlo simulations.

For instance, let's say we have five tasks and we want to project completion for those tasks. Assuming you've done PERT or something similar, you should have two values for each task - a mean, and a standard deviation:

```
---------------------
| Estimate | StdDev |
|        8 |    4   |
|        5 |    1   |
|        3 |    0.5 |
|       13 |    2   |
|        2 |    0.5 |
---------------------
Sum:    31
```

`carly-sheets` will produce 1000 simulated completion times for these values, applying a randomly-generated factor using the log-normal distribution according to the estimate and standard deviation for that estimate to each estimate. Each "simulation" is one set of "actual" values randomly-generated from the estimates and their respective standard deviations, summed together to produce a simulated completion time. The specific distribution was chosen based on the "blowup factor" explained [here](https://erikbern.com/2019/04/15/why-software-projects-take-longer-than-you-think-a-statistical-model.html).
