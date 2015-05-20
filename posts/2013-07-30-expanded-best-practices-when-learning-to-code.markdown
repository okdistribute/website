---
layout: post
title: "Expanded Best Practices when Learning to Code"
date: 2013-06-01 00:43
comments: true
categories: tutorials programming education
---
I came across this nice little blog called [CodeHS](http://blog.codehs.com/).
I’m pretty happy about a lot of the posts I see on it, and although it isn’t
incredibly active, I do find it to have some nice tidbits. Here is a great
little piece titled “Best Practices When Learning to Code.” He doesn’t go into
great practical detail on each point, so I wanted to expand on them in this
post.
<!-- more -->

>1. Keep an open mind. When you learn to program, and you haven’t programmed
before, there will be a lot of new ideas. Be willing to go with the flow.  

You will often be thrown tasks like “Use the reader monad” or “Set
such-and-such MySQL variable to X” or “Benchmark your functions” without much
more help.  Software development, like any discipline or art, has a learning
curve. There are basic building blocks one needs to complete every task. Don’t
be afraid to be confused, and keep an open mind to what more experienced people
are telling you. It’s going to happen over and over again. As with learning any
discipline or art, it takes time to put the building blocks in the right places
so that you can climb the curve. In the programming community there are a lot
of people who seem elitist and unwilling to help you. The hardest part for me
is becoming frustrated when I don’t have these building blocks yet, and I feel
alone and helpless. If you keep pushing and temper your frustrations, you’ll
get those building blocks in due time. You can’t be frustrated, as it will keep
you from an open mind.

> 2. Be willing to play around. One of the best ways to reinforce a programming
concept when you are learning is just to play around with it. Maybe you learn a
new command, a new function, a new concept… try to do the given example, but
try to modify it a little -- just to see what happens.  

It’s just a computer! It actually doesn’t have a mind of it’s own, although it
does seem like it sometimes. I recommend working on a clean installation of
Linux Mint or Ubuntu, and write logs of what your program will do using print
statements and/or writing to a file. *Back up everything you write on version
control (use github.com).* In the worst case, you can always reinstall or go
back to a previous version. :) These small things will make you feel more
secure in your programming, which is important to your success. Just don’t be
afraid. You can only learn from mistakes.

> 3. Style counts. When we teach programming and computer science at CodeHS, we
focus on getting the program to work, but also on writing a program that has
good “style.” What I mean by style is that the program is broken down in a
reasonable way, and that an effort is made to make it understandable for
another person who may come along and read the program.  

This is good advice, and it’s true, but it doesn’t give you any practical
examples. Here is an example of some code with Good Style™:

``` python
def to_csv(timeline, filename):         
	"""Takes a timeline (as a list of dictionaries) 
	writes to file in csv"""

	writer = open(filename, "w")         
	fieldnames = ['date', 'signal', 'volume']    
	writer.write("%s, %s, %sn" % fieldnames)    
	     
	for t in timeline:     
	       writer.write("%s, %s, %sn" % [t.date, t.signal, t.volume])                    
	writer.close() 
```

Good things: comment under the function definition that describes the input and
output of the function in plain English. Variables created and then passed to
functions, so that appropriate names can be assigned and the code is able to
speak for itself. Whitespace in between each logical chunk: instantiating the
writer, writing the fieldnames, writing the rows, closing the writer. One last
thing: Never copy and paste your code. Write a function, create a class, and
call it multiple places. Once you find yourself copying and pasting, you should
seriously consider if you are making your code harder to read and debug. I
promise it will make more work for you in the long run 99% of the time. You
might look at this code two years from now or pass it off to your successor, so
having Good Style™ is a matter of courtesy, practicality, and time efficiency.

> 4. Ask questions. Everyone gets stuck when learning to program -- I promise.
However, a big part of how well you learn is how you respond when you get
stuck. Try to ask good questions -- often the promise of formulating and asking
the question actually helps clarify the problem you are having.

When you hit a problem, here is the order of steps you should use to try to fix it:

0. Find a coding buddy. Preferably, someone who has experience in a different area or has a different coding mindset than you. Some of the easiest problems could be fixed right away. Take turns being the one at the keyboard so you both can learn from each other. I really like pair programming - it produces code generally faster and more accurately, unless you don’t work well together.

1. Stop coding. Take out a piece of paper. Think about what you are doing and try to write it in plain English, use diagrams, or outline the algorithm. This is the most crucial part of these steps, as you will learn more about the problem and be able to articulate your questions, or even answer them yourself.

2. Ask Mr.Google and Stack Overflow. Someone might have already answered it!

3. Ask someone with more experience than you. Ask your boss, advisor, professor, grad student, postdoc friend, whoever. You probably will have learned more about your problem from the previous steps so you can ask the questions clearly and understand their answers even better. If you want to be a coding guru, then you’ll need to learn how to solve problems on your own. If you always go to people who have more experience and get fed the answer, you will fail to learn that valuable skill. Ask questions, but ask yourself first.

> 5. Focus on fun. Learning a new skill is about a million times more interesting when it feels fun. This means find a way to work on it that fits in your schedule, but one that is reasonable and maintainable. Those are just a few tips, but the best way to learn is to just to get started! With CodeHS you start writing your first program in just two minutes. —Jeremy (http://blog.codehs.com/)

I really enjoyed this small set of tidbits, and I hope you find them useful. ‘Till next time...


