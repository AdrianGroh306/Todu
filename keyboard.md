Skip to main content
Stack Overflow
About

Products
For Teams
Search…
Home
Questions
AI Assist
Tags
Challenges
Chat
Articles
Users
Jobs
Companies
Collectives
Communities for your favorite technologies. Explore all Collectives

Stack Internal
Stack Overflow for Teams is now called Stack Internal. Bring the best of human thought and AI automation together at your work.

 
How to prevent iOS keyboard from pushing the view off screen with CSS or JS
Asked 9 years, 6 months ago
Modified 1 month ago
Viewed 69k times
 Part of Mobile Development Collective
57

I have a responsive web page that opens a modal when you tap a button. When the modal opens, it is set to take up the full width and height of the page using fixed positioning. The modal also has an input field in it.

On iOS devices, when the input field is focused, the keyboard opens. However, when it opens, it actually pushes the full document up out of the way such that half of my page goes above the top of the viewport. I can confirm that the actual html tag itself has been pushed up to compensate for the keyboard and that it has not happened via CSS or JavaScript.

Has anyone seen this before and, if so, is there a way to prevent it, or reposition things after the keyboard has opened? It's a problem because I need users to be able to see content at the top of the modal while, simultaneously, I'd like to auto-focus the input field.

javascriptcssioskeyboardresponsive
Share
Improve this question
Follow
edited Oct 3, 2024 at 9:21
Penny Liu's user avatar
Penny Liu
18k55 gold badges8989 silver badges109109 bronze badges
asked Jul 27, 2016 at 17:38
rescuecreative's user avatar
rescuecreative
3,88933 gold badges2121 silver badges2828 bronze badges
Did you see this: stackoverflow.com/questions/13820088/… – 
Iceman
 CommentedJul 27, 2016 at 17:40
@Iceman no I didn't. I tried searching for similar questions but didn't find that one. I'll try it. – 
rescuecreative
 CommentedJul 27, 2016 at 17:41
@rescuecreative . I am not to sure if this will help, as this solution is for IOS8 as i had similar issues on IOS8 and Safari. – 
ankurJos
 CommentedJul 27, 2016 at 17:48 
1
@Iceman My environment is not phonegap, it's just a normal website. So I'm not sure if there's something different about phonegap, but this doesn't work for me. – 
rescuecreative
 CommentedJul 27, 2016 at 17:49
@rescuecreative could be issue with new version. i'll remove my answer. – 
Iceman
 CommentedJul 27, 2016 at 17:50
Show 2 more comments
11 Answers
Sorted by:

Highest score (default)
32

First

<script type="text/javascript">
  $(document).ready(function() {
  document.ontouchmove = function(e){
    e.preventDefault();
  }
});
</script>
Then this

input.onfocus = function () {
  window.scrollTo(0, 0)
  document.body.scrollTop = 0
}
Share
Improve this answer
Follow
edited Oct 3, 2024 at 8:25
Penny Liu's user avatar
Penny Liu
18k55 gold badges8989 silver badges109109 bronze badges
answered Jul 27, 2016 at 18:54
ankurJos's user avatar
ankurJos
51644 silver badges1616 bronze badges
Sign up to request clarification or add additional context in comments.

4 Comments


Nguyen Tran
Over a year ago
Thanks! It works perfectly. Btw, I only use document.body.scrollTop = 0;

neophyte
Over a year ago
I was trying to solve a problem for 4 hours until I encountered your answer. Thank you so much. Although only the input.onfocus = function () {     window.scrollTo(0, 0);     document.body.scrollTop = 0; } is necessary. The first part freezes the page.

Elton Lin
Over a year ago
Why is the first part i.e. e.preventDefault() on touchmove necessary?

Elton Lin
Over a year ago
Also, it seems like the iOS "shove to top" behavior doesn't happen instantly, so I need to do a setTimeout() before actually resetting the window scroll. Now I'm trying to figure out the exact timing so I don't need to use setTimeout
Add a comment
8

For anyone stumbling into this in React, I've managed to fix it adapting @ankurJos solution like this:

const inputElement = useRef(null);

useEffect(() => {
  inputElement.current.onfocus = () => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
  };
});

<input ref={inputElement} />
Share
Improve this answer
Follow
answered Sep 20, 2019 at 13:47
lewislbr's user avatar
lewislbr
1,1821515 silver badges2525 bronze badges
1 Comment


Cagri Uysal
Over a year ago
Maybe one can add an empty dependency array to the useEffect just to make it run once.
5

Turns out, all you have to do is add

position:fixed
To the body tag. This will move the body back down when the virtual keyboard hides.

Share
Improve this answer
Follow
answered Mar 21, 2024 at 19:40
Vincent's user avatar
Vincent
2,2673333 silver badges4242 bronze badges
2 Comments


Rapscallion
Over a year ago
I feel like this is one of the most criminally underrated answers in all of StackOverflow. This behaviour was driving me absolutely bonkers with my Angular app on mobile and hours upon hours of Googling led to bizarre, overengineer solutions. This simple change fixed it immediately with no adverse effects. Thank you.

Jonathan
May 30, 2025 at 23:42
Worked like magic!!!! been looking for a solution for ages! Thank you.
4

I struggled with this for awhile, I couldn't find something that worked well for me.

I ended up doing some JavaScript hackery to make it work.

What I found was that Safari wouldn't push the viewport if the input element was in the top half of the screen. That was the key to my little hack:

I intercept the focus event on the input object and instead redirect the focus to a invisible (by transform: translateX(-9999px)). Then once the keyboard is on screen (usually 200ms or so) I trigger the focus event on the original element which has since animated on screen.

It's a kind of complicated interaction, but it works really well.

function ensureOffScreenInput() {
  let elem = document.querySelector("#__fake_input");
  if (!elem) {
    elem = document.createElement("input");
    elem.style.position = "fixed";
    elem.style.top = "0px";
    elem.style.opacity = "0.1";
    elem.style.width = "10px";
    elem.style.height = "10px";
    elem.style.transform = "translateX(-1000px)";
    elem.type = "text";
    elem.id = "__fake_input";
    document.body.appendChild(elem);
  }
  return elem;
}

var node = document.querySelector('#real-input')
var fakeInput = ensureOffScreenInput();

function handleFocus(event) {
  fakeInput.focus();

  let last = event.target.getBoundingClientRect().top;

  setTimeout(() => {
    function detectMovement() {
      const now = event.target.getBoundingClientRect().top;
      const dist = Math.abs(last - now);

      // Once any animations have stabilized, do your thing
      if (dist > 0.01) {
        requestAnimationFrame(detectMovement);
        last = now;
      } else {
        event.target.focus();
        event.target.addEventListener("focus", handleFocus, { once: true });
      }
    }
    requestAnimationFrame(detectMovement);
  }, 50);
}

node.addEventListener("focus", handleFocus, { once: true });
Personally I use this code in a Svelte action and it works really well in my Svelte PWA clone of Apple Maps.

Video of it working in a PWA clone of Apple Maps

You'll notice in the video that the auto-complete changes after the animation of the input into the top half of the viewport stabilizes. That's the focus switch back happening.

The only downside of this hack is that the focus handler on your original implementation will run twice, but there are ways to account for that with metadata.

Share
Improve this answer
Follow
answered Nov 25, 2020 at 4:59
Thomas Millar's user avatar
Thomas Millar
6144 bronze badges
1 Comment


Glass Cannon
Over a year ago
Maybe I did the setup wrong but I couldn't get this to working with lambdatest.com real device test. The code was in an iframe attached to inputs also in the iframe and console.log prints were correct on input focus handlers and input was indeed shifting to the fake element but keyboard still pushed the page.
1

CSS,

html,
body {
  overflow-y: auto;
  overflow-x: hidden;
  position: fixed;
}
Share
Improve this answer
Follow
edited May 5, 2023 at 7:46
Wongjn's user avatar
Wongjn
27.2k55 gold badges2424 silver badges5050 bronze badges
answered May 2, 2023 at 6:47
Bhagirathi Nayak's user avatar
Bhagirathi Nayak
1122 bronze badges
2 Comments


Community
Over a year ago
Your answer could be improved with additional supporting information. Please edit to add further details, such as citations or documentation, so that others can confirm that your answer is correct. You can find more information on how to write good answers in the help center.

Sean
Over a year ago
After many other attempts, position: fixed on our react apps #root div did the trick. Thank you. Not sure if this will have some side effects for our app, but we'll see
1

On the latest version of iOS (18.11) this was the only thing that worked for me inside of a PWA.

function renderAfterIOSKeyboardClosed(event) {

    // After a keyboard is closed on IPAD MINI 6TH GENERATION iOS 18.1.1 there is a large blank space left after pushing the content up.
    // This detects the keybord closing, and waits for the paint cycle to trigger a repaint by scrolling

    // Only apply to inputs and textareas
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        console.log('Element blurred:', event.target);

        // Use requestAnimationFrame to wait for the next paint cycle
        requestAnimationFrame(function () {
            // If the target was pushed out of view, scroll it into view.
            event.target.scrollIntoView({ behavior: 'instant', block: 'end' }); 
        });
    }
}

// Attach globally for all blur events
document.addEventListener('blur', renderAfterIOSKeyboardClosed, true); // Use capturing phase for delegation
Share
Improve this answer
Follow
edited Nov 22, 2024 at 2:05
answered Nov 20, 2024 at 4:30
clamchoda's user avatar
clamchoda
5,12133 gold badges4646 silver badges8383 bronze badges
Comments

0

you could also do this if you don't want scrollTo the top(0, 0)

window.scrollBy(0, 0)
Share
Improve this answer
Follow
answered Nov 13, 2019 at 3:12
Otani Shuzo's user avatar
Otani Shuzo
1,25811 gold badge1414 silver badges2323 bronze badges
Comments

0

const handleResize = () => {
  document.getElementById('header').style.top = window.visualViewport.offsetTop.toString() + 'px'
}

if (window && window.visualViewport) visualViewport.addEventListener('resize', handleResize)
Source: https://rdavis.io/articles/dealing-with-the-visual-viewport

Share
Improve this answer
Follow
answered Jan 23, 2023 at 9:56
ekimas's user avatar
ekimas
55688 silver badges1616 bronze badges
Comments

0

It's quite strange. When there are multiple inputs in the pop-up window, the content will pop up and then return to its original state. So when switching forms, the content keeps popping up. I don't know if it's due to my code

  const lockScroll = () => {
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.body.scrollTop = 0;
  };

  const unlockScroll = () => {
    document.body.style.position = '';
    document.body.style.width = '';
    document.documentElement.style.position = '';
    document.documentElement.style.width = '';
  };

  // Only apply scroll lock on mobile for step-3 inputs
  if (window.innerWidth <= MOBILE_MAX_WIDTH) {
    document.addEventListener('focusin', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        const isStep3Input = e.target.closest('.step-3');
        if (isStep3Input) {
          lockScroll();
        }
      }
    });


    document.addEventListener('focusout', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        const wasStep3Input = e.target.closest('.step-3');
        if (wasStep3Input) {
          // Delay to allow focus to move to another input in step-3
          setTimeout(() => {
            const activeElement = document.activeElement;
            const stillInStep3 = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') && activeElement.closest('.step-3');
            if (!stillInStep3) {
              unlockScroll();
            }
          }, 300);
        }
      }
    });
  }
Share
Improve this answer
Follow
answered Dec 16, 2025 at 8:01
yousekle lu's user avatar
yousekle lu
1
Comments

-5

Both IOS8 and Safari bowsers behave the same for input.focus() occuring after page load. They both zoom to the element and bring up the keyboard.(Not too sure if this will be help but have you tried using something like this?)

HTML IS

<input autofocus>
JS is

for (var i = 0; i < 5; i++) {
document.write("<br><button onclick='alert(this.innerHTML)'>" + i + "</button>");
}

//document.querySelector('input').focus();
CSS

button {
width: 300px;
height: 40px;
}
ALso you will have to use a user-agent workaround, you can use it for all IOS versions

if (!/iPad|iPhone|iPod/g.test(navigator.userAgent)) {
element.focus();
}
Share
Improve this answer
Follow
answered Jul 27, 2016 at 17:54
ankurJos's user avatar
ankurJos
51644 silver badges1616 bronze badges
4 Comments


rescuecreative
Over a year ago
Sorry, maybe I'm not understanding. How will the buttons and alerts help?

ankurJos
Over a year ago
@rescuecreative i guess i have understood it wrong. I was thinking that maybe you are trying to show virtual keyboard and scroll after page touch.

rescuecreative
Over a year ago
Ah, I see. No, I'm trying to stop the virtual keyboard from pushing the DOM outside of the viewport

ankurJos
Over a year ago
@rescuecreative just a sggestion have you tried using these two options mentioned below?
Add a comment
-5

In some situations this issue can be mitigated by re-focusing the input element.

input.onfocus = function () {
  this.blur();
  this.focus();
}
Share
Improve this answer
Follow
answered Apr 11, 2019 at 10:45
malthe's user avatar
malthe
1,47711 gold badge1919 silver badges3535 bronze badges
1 Comment


Sujit Kumar Singh
Over a year ago
This approach will hang the device. Imagine blurring and refocussing on the same element for an infinite time.
Your Answer
 

  
Sign up or log in
Post as a guest
Name
Email
Required, but never shown

By clicking “Post Your Answer”, you agree to our terms of service and acknowledge you have read our privacy policy.

Start asking to get answers

Find the answer to your question by asking.

Explore related questions

javascriptcssioskeyboardresponsive
See similar questions with these tags.

Mobile Development
Collective
 This question is in a collective: a subcommunity defined by tags with relevant content and experts.
The Overflow Blog
Automate your security whack-a-mole: Q&A with Exaforce
AI can 10x developers...in creating tech debt
Featured on Meta
AI Assist: recent updates (January 2026)
Community Engagement Across the Network: Focus for 2026
All users on Stack Overflow can now participate in chat
Policy: Generative AI (e.g., ChatGPT) is banned
Stack Overflow now uses machine learning to flag spam automatically
No, I do not believe this is the end
Community activity
Last 1 hr
Users online activity
4621 users online
 10 questions
 7 answers
 19 comments
 117 upvotes
Popular tags

php
rendering
python
javascript
java
Linked
22
How to prevent keyboard push up webview at iOS app using phonegap
20
iOS Safari: Prevent (or Control) Scroll on Input Focus
10
Prevent page/view push-up when keyboard opens in iOS
6
How to disable vertical centering of input field on focus with iOS devices (ReactJS in Safari/Chrome)?
-2
.NET MAUI Blazor How to prevent iOS keyboard from pushing up the entire screen when focus on textarea?
Related
0
how do i reposition the view on an iOS browser when the virtual keyboard pops up?
0
Screen shifting when iPad keyboard opens
2
How to disable screen offset in iPad safari when keyboard is shown
13
Prevent scrolling on keyboard display iOS 6
15
Want to have browser viewport resize when iOS keyboard is activated
1
Prevent keyboard from shrinking viewport
16
iPhone Web App - Prevent keyboard from moving/push up view - iOS8
40
How to make fixed-content go above iOS keyboard?
6
Page scrolls up in virtual keyboard's presence in iphone
0
Ignore or disable mobile viewport resize when focus on input in iPhone
Hot Network Questions
Are there any mechanics that can be used to incentivize players to act a certain way similar to inspiration?
Question about einstein problem
Need clarification for measure 15 of BWV 825 Sarabande
How many sons for Isaac?
Is there a musical term for the "black keys"?
How to remove duplicate vertices without breaking the mesh?
A faster timegm()?
Where are the words? A connect wall
What is the meaning of the Airbus model numbering system?
Superman comic where a boy imitating him blocks his powers
Can PCI parallel port cards use DMA like normal parallel ports?
Oxidation of SnCl2 to SnO2 using a hydrothermal route
Raise integral signs with limits
Camera tracking to a NURBS curve moving too fast
What is the function of this dual current regulator symbol?
A novel about a future galactic war against a race I think are called Hydranics. Possibly DAW books
Would a box experience any sliding friction when it follows the curve of a roller conveyor?
Equivalent to 3DSMax Editable Poly 'outline'?
Mermin's Lights Out
After an offeree has made a counteroffer, do they still have the power to accept the original offer?
Batcher's sort in C++20 - Take II
How to detect demagnetization of transformer in flyback topology?
A new kind of ligature, connected d/p
Construction of a large stealth spacecraft
 Question feed







Stack Overflow
Questions
Help
Chat
Business
Stack Internal
Stack Data Licensing
Stack Ads
Company
About
Press
Work Here
Legal
Privacy Policy
Terms of Service
Contact Us
Cookie Settings
Cookie Policy
Stack Exchange Network
Technology
Culture & recreation
Life & arts
Science
Professional
Business
API
Data
Blog
Facebook
Twitter
LinkedIn
Instagram
Site design / logo © 2026 Stack Exchange Inc; user contributions licensed under CC BY-SA . rev 2026.1.22.38918

