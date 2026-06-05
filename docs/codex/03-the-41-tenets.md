# The 41 Tenets

The core commitments of a War Room member. Referenced directly in `lib/system-prompt.ts` — if the journal shows me violating these, the AI surfaces it.

---

1. I believe that men have the divine imperative to become as capable, powerful and competent as possible in this life.

2. I reserve my human right to hold my own beliefs and practice them as I see fit and allow other people the same right to believe and act as they wish.

3. I prefer loving rewarding consensual relationships with beautiful positive and virtuous women.

4. I believe men and women are different and that each has their own unique and important strengths and abilities.

5. I believe men have the sacred duty to protect and provide for the important people in their lives.

6. I believe men have the sacred duty to protect the innocence and sanctity of their children and reserve the right and responsibility to raise their children as they see best to ensure their long-term happiness and success.

7. I believe that men have the sacred duty to raise strong capable and honorable sons.

8. I believe that men have the sacred duty to raise kind feminine and virtuous daughters.

9. I utterly disapprove of violence within romantic or familiar relationships.

10. I support good and honest governments who will obey their laws.

11. I prefer to only conduct business dealings with trusted and vetted brothers.

12. I believe that a man has a sacred duty to hold true to his word and do exactly what he says he will do.

13. I believe that a man's life is difficult and that he has a sacred duty to become strong to handle such difficulty.

14. I believe men are personally responsible for their actions and for the results they achieve in their lives.

15. I believe in emotional control and the vital need to become disciplined and professional in all things.

16. I believe that men have the sacred duty to approach everything in life from a position strength.

17. I believe that all men have the sacred duty to become men of upright and virtuous character and live above all possible reproach.

18. I believe it is incumbent upon me to ruthlessly identify my own weaknesses and limitations and I eagerly work to overcome them and become more capable in all realms.

19. I seek to improve my personal freedom to think, act and live to my masculine imperative in all ways.

20. I believe each man has a sacred duty to mold the physical body into the strongest and most resilient and most capable version of itself.

21. I believe that men have the sacred duty to rigorously train themselves both physically and mentally every day.

22. I believe that I have the sacred duty to only eat the highest quality foods possible.

23. I reserve the right to protect the sanctity of my bloodstream and make my own decisions about medical care and procedures.

24. I affirm the importance of endlessly improving my mental faculties through diligent work, study and practice.

25. I believe in acquiring wealth and abundance in order to improve my life and do good for those I care about.

26. I believe in the merits of healthy competition and constantly encourage all men to seek out competition to improve themselves.

27. I believe that masculine brotherhood is essential to men's mental health, happiness and success. And I relentlessly encourage men to meet together, train together and work together.

28. I maintain the trust of my brothers through reverent silence, regarding our most sacred and shared experiences.

29. I believe in honoring my ancestors and living in a way that would make most of them proud of me today.

30. I reserve the right to administer difficult rites of passage for our young men to allow them to earn the rank of manhood.

31. I affirm the importance and need for travel and adventure as men.

32. I seek to help men overcome poor mental health through embracing hard work, physical improvements and shared masculine brotherhood.

33. I reserve the right to make the best choices I can at the time to protect myself and respect my mental health.

34. I do good in the world and seek to help those less fortunate.

35. I believe all men have the responsibility to lead and guide those they care about for greater health, prosperity and happiness.

36. I choose to only interact with those who are respectful and civil to me in return for my own respectfulness and civility.

37. I reserve the freedom to speak and refer to others as I believe is best and most truthful.

38. I reserve the right to choose my company and include only those whom I believe are best for my health, happiness and success.

39. I believe I have an imperative to only spend my time that I determine is beneficial, uplifting and empowering to myself and others.

40. I choose to only allow myself to be influenced by those who I believe have my best interests in mind.

41. Each day I dedicate myself to create anew the greatest possible positive impact on the world and do the work necessary to achieve a greater masculine excellence across all realms of human endeavor.

---

## How these show up in the brief

The system prompt summarizes the operationally critical Tenets (the ones the AI uses to evaluate my daily choices) rather than pasting all 41. The current summary in the system prompt covers:

- **#12** — do exactly what I say I will do
- **#13** — life is difficult, become strong to handle it
- **#14** — personal responsibility for results
- **#15** — emotional control and discipline
- **#16** — approach everything from a position of strength
- **#17** — character above reproach
- **#18** — ruthlessly identify my own weaknesses
- **#21** — train physically and mentally every day
- **#25** — build wealth as a tool for freedom and impact
- **#39** — only spend time on what's beneficial, uplifting, empowering

If the journal shows me violating any of these, the AI surfaces it in the honest callout or villain note. If my behavior over a week pattern-matches to softening on any of them, the brief should escalate.

The other 31 Tenets aren't ignored — they're the broader values framework. They live here as the full reference. If I want the brief to enforce one of them more directly, I edit `lib/system-prompt.ts` to add it to the operational set.
