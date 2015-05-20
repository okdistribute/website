---
layout: post
title: "Python and PyData Conferences are important for the future of social science research"
date: 2013-11-14 17:51
comments: true
categories: academia python conferences
---
Imagine you are a graduate student of some social or behavioral science (not
hard, I assume). You want to collect some data: say I’m going to study the
fluctuation of value of products over time on Craiglist, or ping the [Sunlight
Foundation’s](http://sunlightfoundation.com/) open government data, or use the [GDELT](http://gdelt.utdallas.edu/)
to study violent political events. There are a variety of tools I may end up using for my workflow:

1.  Retrieving the data: *Python, BeautifulSoup*    
2.  Storing the data: *CSV, Json, MySQL, MongoDB, bash*  
3.  Retrieving this stored data: *SQL, Hive, Hadoop, Python, Java*  
4.  Manipulating the data: *Python, CSV, R*  
5.  Running regressions, simulations: *R, Python, STATA, Java*  
6.  Presenting the data: *R, Excel, Powerpoint, Word, LaTeX*

My workflow for doing research now requires a variety of tools, some of which I
might have never used before. The number of tools I use seems to scale with the
amount of work I try to accomplish. When I encounter a problem in my analysis,
or can’t reproduce some regression or simulation I ran, what happened?
Where did it break?  
<!-- more -->

Should it really be this difficult? Should I really have to learn 10 different
tools to do data analysis on large datasets? We can look at the Big
Data problem in a similar light as surveys and regression models. The
largest and most fundamental part of the equation is just that this stuff is new
– high-priority and well thoughout workflows have yet to be fully developed and stablized.  

What if I told you that you could do all of this with the fantastically large
number of open source packages in Python? [In your web
browser](http://wakari.io), on your iPad?  

## Python and PyData
I just returned from a trip to NYC at
[PyData](http://pydata.org/nyc2013/schedule/). It’s a three-day conference,
with one day of tutorials and two days of full-length talks all about big
questions at the intersection of python and data. 

At the conference, you have your typical budding entrepreneurs, entrenched data
scientists, and internal language engineers. Strikingly, there was a healthy
amount of people who were amateur pythonistas, those who wanted to learn more
about the language to see if they could make the switch.

I recently [wrote my
thoughts](http://karissamck.com/blog/2013/10/30/big-data-is-big-because-it-doesnt-load-into-r/)
about what I will call "legacy tools," such as R, SPSS, Matlab, and FORTRAN.
These tools, particularly R, are becoming obsolete because they can't handle your Big
Data problem. When using these tools, your data often seems 'Big' because it
doesn't fit into memory, or the language was poorly designed, or it doesn't
have easy to use libraries for integrating into a database. And often, it crashes your
computer. 

You may be surprised that I am putting R on this list, for R is a well-known,
broadly used tool in statistics and data analysis.  However, in the context of
the social sciences, and my above examples, we are still often forced take a variety of
approaches to collecting, storing, and manipulating that data.  This process is
now fragmented, and R is just a piece. Python, on the other hand, can do it
all. And quickly. It's going to the foundation of the future of this trade.

At PyData, the community of about 500 listened to talks. The talks ranged from
["Intro to Python Data Analysis in Wakari"](http://pydata.org/nyc2013/speakers/#145) to ["PyParallel: How we Removed the
GIL and Exploited all Cores"](http://pydata.org/nyc2013/abstracts/#125), which
was about creating a parallelized language toolkit on Windows in 136 slides
times 5 bullet points. It’s clear that the community is disparate, and there’s
a lot going on – a lot to say at many different levels, from everything to
tutorials to crafting the language. There are a substantial amount of people
making python fast for datasets and simulations of arbitrary size
and scale.

## The Coolest new Python Data thing
PyData, PyCon, and SciPy are places where people often reveal the next ‘cool
thing’ that’s going to revolutionize the way we do everything, like eat cereal.
But realistically, something very important was demoed this weekend. 

IPython Notebook is a fantastic tool for [doing data
analysis](http://www.pgbovine.net/ipython-notebook-first-impressions.htm) in
python. As Philip Guo puts it, 

> Everything related to my analysis is located in one unified place. Instead
> of saving dozens or hundreds of code, output, and notes files for an
> experiment, everything is bundled together in one single file. 

These notebooks can be printed to a variety of formats, including HTML and PDF
(actually, [a couple of python
books](http://www.packtpub.com/learning-ipython-for-interactive-computing-and-data-visualization/book)
have been written this way!) The IPython notebook makes it easy to reproduce
research, as all of your documentation and code is inline with the plots, with
the ability to do live manipulation if you use [Wakari](http://wakari.io).

Brain Granger showed up and gave the crowd a tour of the new IPython Notebook
feature called “interact.” Interact lets you create a function that has output,
and manipulate the parameters to that function in near real-time. It is similar
to [Mathematica’s
manipulate](http://reference.wolfram.com/mathematica/ref/Manipulate.html).
Imagine a high school student seeing manipulation of a sin wave in real time by
moving a slider, or a physics researcher being able to analyze a plot from
multiple angles and easily explain parameter changes to their audience. It's
going to change everything in the programming and data analysis space,
particularly in regard to teaching and reproducing results. The interact
feature is due to release in January.

## Conclusion 
If we want to incorporate large datasets without filtering and corrupting our
analysis with assumptions, we need to develop a toolkit that is easy to teach,
easy to use, easy to reproduce, and easy to extend. Python is all of these
things. We need to be able to understand and estimate the impact of Python and
consider teaching it alongside R, or even in place of it. 

The IPython notebook is a good entry point to make the switch to python for
your data analysis, but it's hard to learn a new tool.  I recommend starting
with tutorials on [Wakari](http://wakari.io/gallery), and if you want to
install packages locally, use
[Anaconda](http://continuum.io/download), not pip.

The time has come to upgrade our stack, and Python is my recommendation. Maybe
I’ll see you at the next PyData.


