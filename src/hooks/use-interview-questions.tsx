import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const INITIAL_QUESTIONS = [
  "Tell me about yourself"
];

const FALLBACK_QUESTIONS = [
  "What programming languages are you most comfortable with?",
  "Tell me about a project you worked on recently.",
  "What areas of technology are you interested in?",
  "Have you done any internships or part-time work?",
  "What kind of development interests you the most?",
  "What made you choose programming as your field of study?",
  "What tools or frameworks have you used in your projects?",
  "Tell me about a bug you encountered and how you solved it.",
  "What coding concepts do you find most interesting?",
  "What are your career goals after graduation?",
  "Have you worked on any team projects?",
  "What resources do you use to learn new programming concepts?",
  "What areas of programming would you like to improve?",
  "Tell me about a challenging assignment you completed recently.",
  "What technical skills are you hoping to develop?"
];

export function useInterviewQuestions() {
  const [questions, setQuestions] = useState<string[]>(INITIAL_QUESTIONS);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKey] = useState<string>("AIzaSyCOBCIctPCJp3d0L8MEdAUoPF3dBnSCFLI");
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const pendingRequestRef = useRef<AbortController | null>(null);
  const candidateProfileRef = useRef<string>("");
  const askedQuestionsRef = useRef<Set<string>>(new Set(INITIAL_QUESTIONS));

  const totalQuestions = 15;

  const correctGrammar = useCallback(async (text: string): Promise<string> => {
    if (!apiKey || !isApiAvailable) {
      return text;
    }
    
    try {
      const abortController = new AbortController();
      
      const prompt = `
        Correct any small grammar and spelling mistakes in this text, but keep the original meaning. 
        Use simple English. Return only the corrected text:
        
        "${text}"
      `;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 200,
            topP: 0.95,
            topK: 40
          }
        }),
        signal: abortController.signal
      });
      
      if (!response.ok) {
        console.error('Grammar correction request failed:', response.status);
        return text;
      }
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
      }
      
      return text;
    } catch (error) {
      console.error('Error correcting grammar:', error);
      return text;
    }
  }, [apiKey, isApiAvailable]);

  const generateSimpleFeedback = (answer: string) => {
    const templates = [
      "Your answer is good! Just make sure to include more specific examples next time.",
      "That's a clear answer. You might want to explain a bit more about why you made those choices.",
      "Good points! Try to be more specific about what you learned from that experience.",
      "Nice answer! Consider mentioning how this connects to the job you're applying for.",
      "Well explained! You could add a bit more about the challenges you faced."
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  };

  const generateFeedback = useCallback(async (answer: string, question: string) => {
    if (!apiKey || !isApiAvailable) {
      return generateSimpleFeedback(answer);
    }
    
    try {
      if (pendingRequestRef.current) {
        pendingRequestRef.current.abort();
      }
      
      const abortController = new AbortController();
      pendingRequestRef.current = abortController;
      
      const prompt = `
        You are giving feedback to a student in a job interview. They just answered this question:
        
        Question: "${question}"
        
        Answer: "${answer}"
        
        Give them simple, helpful feedback in 2-3 sentences. Use everyday words that are easy to understand.
        Focus on:
        1. Mentioning what they did well
        2. Pointing out 1-2 small mistakes they could fix
        3. Giving a simple tip for improvement
        
        Use words a high school student would understand. Be friendly and encouraging.
      `;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
            topP: 0.8,
            topK: 40
          }
        }),
        signal: abortController.signal
      });
      
      pendingRequestRef.current = null;
      
      if (!response.ok) {
        console.error('Feedback API request failed with status:', response.status);
        const errorText = await response.text();
        console.error('Feedback API error response:', errorText);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const generatedFeedback = data.candidates[0].content.parts[0].text.trim();
        return generatedFeedback;
      } else {
        console.error('Unexpected API response format for feedback:', data);
        throw new Error('Unexpected API response format');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Feedback request was aborted');
        return null;
      }
      console.error('Error generating feedback:', error);
      return generateSimpleFeedback(answer);
    }
  }, [apiKey, isApiAvailable]);

  const generateTechnicalQuestionsBasedOnProfile = useCallback(async (profile: string): Promise<string | null> => {
    if (!apiKey || !isApiAvailable || !profile || profile.trim() === '') {
      console.log("Using fallback question due to missing API or empty profile");
      return FALLBACK_QUESTIONS[Math.min(currentQuestionIndex, FALLBACK_QUESTIONS.length - 1)];
    }

    try {
      if (pendingRequestRef.current) {
        pendingRequestRef.current.abort();
      }
      
      const abortController = new AbortController();
      pendingRequestRef.current = abortController;
      
      console.log("Generating technical question based on candidate profile:", profile.substring(0, 100) + "...");
      
      const askedQuestionsArray = Array.from(askedQuestionsRef.current);
      
      const prompt = `
        You are interviewing a student for their first tech job. Here's their self-introduction:
        "${profile}"
        
        Based on the skills, technologies, and experiences they mentioned, generate ONE specific technical interview question. If they mentioned specific technologies (like Java, Python, React, etc.), ask about those. If they mentioned projects, ask a technical question about the implementation details.
        
        IMPORTANT GUIDELINES:
        1. Make the question technical but appropriate for a beginner/student level
        2. Only ask ONE question that is directly related to what they mentioned in their introduction
        3. Use simple language that is easy to understand
        4. Make sure the question ends with a question mark
        5. Focus on the most prominent skill or technology they mentioned
        6. DO NOT repeat any of these previously asked questions: ${askedQuestionsArray.join(" | ")}
        7. Make sure to explore a DIFFERENT aspect of their background than what was covered in previous questions
        
        IMPORTANT: Return ONLY the question with no other text or explanations.
      `;
      
      console.log("Sending prompt to generate technical question based on profile");
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
            topP: 0.8,
            topK: 40
          }
        }),
        signal: abortController.signal
      });
      
      pendingRequestRef.current = null;
      
      if (!response.ok) {
        console.error("API error status:", response.status);
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API response for technical question:", data);
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        let nextQuestion = data.candidates[0].content.parts[0].text.trim();
        
        if (!nextQuestion.endsWith('?')) {
          nextQuestion += '?';
        }
        
        console.log("Generated technical question:", nextQuestion);
        
        if (askedQuestionsRef.current.has(nextQuestion)) {
          console.log("Question already asked, generating a fallback");
          return FALLBACK_QUESTIONS[Math.min(currentQuestionIndex, FALLBACK_QUESTIONS.length - 1)];
        }
        
        askedQuestionsRef.current.add(nextQuestion);
        
        return nextQuestion;
      } else {
        console.error("Unexpected API response format:", data);
        throw new Error('Unexpected API response format');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Question generation request was aborted');
        return null;
      }
      console.error('Error generating technical question:', error);
      return FALLBACK_QUESTIONS[Math.min(currentQuestionIndex, FALLBACK_QUESTIONS.length - 1)];
    }
  }, [apiKey, isApiAvailable, currentQuestionIndex]);

  const generateNextQuestion = useCallback(async (previousAnswer: string): Promise<string | null> => {
    if (!apiKey || !isApiAvailable) {
      console.log("Using fallback question due to missing API");
      return FALLBACK_QUESTIONS[Math.min(currentQuestionIndex, FALLBACK_QUESTIONS.length - 1)];
    }

    if (!candidateProfileRef.current || candidateProfileRef.current.trim() === '') {
      console.error("No candidate profile available for generating questions");
      return FALLBACK_QUESTIONS[Math.min(currentQuestionIndex, FALLBACK_QUESTIONS.length - 1)];
    }

    try {
      if (pendingRequestRef.current) {
        pendingRequestRef.current.abort();
      }
      
      const abortController = new AbortController();
      pendingRequestRef.current = abortController;
      
      console.log("=== GENERATING NEXT QUESTION ===");
      console.log("Candidate profile (excerpt):", candidateProfileRef.current.substring(0, 100) + "...");
      console.log("Current question index:", currentQuestionIndex);
      
      const askedQuestionsArray = Array.from(askedQuestionsRef.current);
      
      const prompt = `
        You are interviewing a student for their first tech job. 
      
        CANDIDATE PROFILE: "${candidateProfileRef.current}"
      
        Based on the technical skills, projects, and experiences mentioned in their self-introduction above:
        1. Generate ONE technical interview question that explores a DIFFERENT aspect of their background
        2. Don't follow up on their previous answers, focus on something new from their initial self-introduction
        3. Make it appropriate for a student/fresh graduate level
        4. Use simple and clear language
        5. Questions should progressively explore different aspects mentioned in their introduction
        6. DO NOT repeat any of these previously asked questions: ${askedQuestionsArray.join(" | ")}
        7. Make your new question distinctly different from any previous questions
      
        Current question number: ${currentQuestionIndex + 1}
      
        IMPORTANT: Return ONLY the question with a question mark. Don't include any other text or explanations.
      `;
      
      console.log("Sending prompt for next question generation");
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 150,
            topP: 0.9,
            topK: 40
          }
        }),
        signal: abortController.signal
      });
      
      pendingRequestRef.current = null;
      
      if (!response.ok) {
        console.error("API error status:", response.status);
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API response for next question:", data);
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        let nextQuestion = data.candidates[0].content.parts[0].text.trim();
        
        if (!nextQuestion.endsWith('?')) {
          nextQuestion += '?';
        }
        
        console.log("Generated next question:", nextQuestion);
        
        const tooSimilar = Array.from(askedQuestionsRef.current).some(q => {
          const words1 = q.toLowerCase().split(/\s+/);
          const words2 = nextQuestion.toLowerCase().split(/\s+/);
          const commonWords = words1.filter(w => words2.includes(w));
          return commonWords.length > 0.6 * Math.min(words1.length, words2.length);
        });
        
        if (tooSimilar) {
          console.log("Generated question too similar to previous ones, using fallback");
          return FALLBACK_QUESTIONS[Math.min(currentQuestionIndex, FALLBACK_QUESTIONS.length - 1)];
        }
        
        askedQuestionsRef.current.add(nextQuestion);
        
        return nextQuestion;
      } else {
        console.error("Unexpected API response format:", data);
        throw new Error('Unexpected API response format');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Question generation request was aborted');
        return null;
      }
      console.error('Error generating next question:', error);
      return FALLBACK_QUESTIONS[Math.min(currentQuestionIndex, FALLBACK_QUESTIONS.length - 1)];
    }
  }, [apiKey, currentQuestionIndex, isApiAvailable]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (isLoading) {
      toast.error("Please wait for the current processing to complete");
      return;
    }
    
    console.log(`Submitting answer for question ${currentQuestionIndex}: ${answer.substring(0, 50)}...`);
    
    const correctedAnswer = await correctGrammar(answer);
    console.log("Original answer:", answer.substring(0, 50));
    console.log("Corrected answer:", correctedAnswer.substring(0, 50));
    
    if (currentQuestionIndex === 0) {
      candidateProfileRef.current = correctedAnswer;
      console.log("Stored candidate profile:", correctedAnswer.substring(0, 100) + "...");
    }
    
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = correctedAnswer;
      return newAnswers;
    });
    
    setIsLoading(true);
    
    try {
      const currentFeedback = await generateFeedback(correctedAnswer, questions[currentQuestionIndex]);
      
      if (currentFeedback === null) {
        setIsLoading(false);
        return;
      }
      
      setFeedback(prev => {
        const newFeedback = [...prev];
        newFeedback[currentQuestionIndex] = currentFeedback;
        return newFeedback;
      });
      
      if (currentQuestionIndex >= totalQuestions - 1) {
        setIsLoading(false);
        return;
      }
      
      let nextQuestion;
      if (currentQuestionIndex === 0) {
        console.log("Generating first technical question based on candidate profile");
        nextQuestion = await generateTechnicalQuestionsBasedOnProfile(correctedAnswer);
      } else {
        console.log("Generating follow-up question based on answer to question", currentQuestionIndex);
        nextQuestion = await generateNextQuestion(correctedAnswer);
      }
      
      if (nextQuestion === null) {
        setIsLoading(false);
        return;
      }
      
      console.log(`Successfully generated next question: "${nextQuestion}"`);
      
      setQuestions(prev => {
        const newQuestions = [...prev];
        if (newQuestions.length <= currentQuestionIndex + 1) {
          newQuestions.push(nextQuestion!);
        } else {
          newQuestions[currentQuestionIndex + 1] = nextQuestion!;
        }
        return newQuestions;
      });
    } catch (error) {
      console.error('Error in submitAnswer:', error);
      toast.error('Error processing your answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    currentQuestionIndex, 
    questions, 
    generateFeedback, 
    generateNextQuestion, 
    totalQuestions, 
    isLoading, 
    correctGrammar, 
    generateTechnicalQuestionsBasedOnProfile
  ]);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      toast.success("Interview completed! Thank you for your responses.");
    }
  }, [currentQuestionIndex, totalQuestions]);

  const currentQuestion = questions[currentQuestionIndex] || "";
  const currentAnswer = answers[currentQuestionIndex] || "";
  const currentFeedback = feedback[currentQuestionIndex] || "";
  const questionNumber = currentQuestionIndex + 1;

  return {
    currentQuestion,
    currentAnswer,
    currentFeedback,
    questionNumber,
    totalQuestions,
    isLoading,
    submitAnswer,
    nextQuestion,
    allQuestions: questions,
    allAnswers: answers,
    allFeedback: feedback
  };
}
