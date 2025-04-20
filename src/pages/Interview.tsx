
import { useState, useRef, useEffect } from "react";
import { Camera, ArrowRight, ChevronDown, ChevronUp, Send, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInterviewQuestions } from "@/hooks/use-interview-questions";

const Interview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [minimizedAnswers, setMinimizedAnswers] = useState<Record<number, boolean>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const isMobile = useIsMobile();

  const { 
    currentQuestion, 
    currentAnswer, 
    currentFeedback,
    questionNumber, 
    totalQuestions, 
    isLoading, 
    submitAnswer,
    nextQuestion,
    allQuestions,
    allAnswers,
    allFeedback
  } = useInterviewQuestions();

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      stopSpeechRecognition();
    };
  }, []);

  const toggleAnswerMinimized = (index: number) => {
    setMinimizedAnswers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("Camera preview started");
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const startSpeechRecognition = () => {
    try {
      if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
        toast.error("Speech recognition not supported in this browser");
        return;
      }
      
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      let finalTranscriptBuffer = '';
      let interimTranscriptBuffer = '';
      let lastUpdateTime = 0;
      
      recognition.onresult = (event: any) => {
        const now = Date.now();
        if (now - lastUpdateTime < 100) {
          return;
        }
        
        finalTranscriptBuffer = '';
        interimTranscriptBuffer = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptBuffer += transcript;
          } else {
            interimTranscriptBuffer += transcript;
          }
        }
        
        setCurrentTranscript(finalTranscriptBuffer);
        setTranscript(finalTranscriptBuffer + (interimTranscriptBuffer ? ` ${interimTranscriptBuffer}` : ''));
        
        lastUpdateTime = now;
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast.error(`Recognition error: ${event.error}`);
      };
      
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast.error("Failed to start speech recognition");
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const downloadRecording = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `interview-recording-${new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleStartRecording = async () => {
    if (!isRecording) {
      if (!streamRef.current) {
        await startCamera();
      }
      
      try {
        recordedChunksRef.current = [];
        
        const mediaRecorder = new MediaRecorder(streamRef.current as MediaStream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          console.log("Recording available");
          toast.success("Recording saved successfully");
          downloadRecording(blob);
        };
        
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        
        setTranscript("");
        setCurrentTranscript("");
        startSpeechRecognition();
        
        setIsRecording(true);
        toast.success("Recording started successfully");
      } catch (error) {
        console.error("Error starting recording:", error);
        toast.error("Could not start recording");
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      
      stopSpeechRecognition();
      
      setIsRecording(false);
      toast.info("Recording stopped");
    }
  };

  const handleSubmitTranscript = () => {
    if (transcript) {
      submitAnswer(transcript);
      setTranscript("");
      toast.success("Processing your answer...");
    } else {
      toast.error("Please record your answer first");
    }
  };

  const handleNextQuestion = () => {
    nextQuestion();
    if (questionNumber > 0) {
      setMinimizedAnswers(prev => ({
        ...prev,
        [questionNumber - 1]: true
      }));
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-gray-100 flex flex-row">
      <div className="w-[60%] h-full p-4 flex flex-col space-y-4">
        <div className="h-[70%] bg-gray-900 rounded-lg relative">
          <video
            ref={videoRef}
            className="w-full h-full rounded-lg object-cover"
            autoPlay
            playsInline
            muted
          >
            Your browser does not support the video element.
          </video>
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
            <div className="flex items-center justify-center w-full">
              <Button
                className={`${
                  isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={handleStartRecording}
                disabled={isLoading}
              >
                {isRecording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>
            </div>
          </div>
        </div>

        <div className="h-[40%] bg-white rounded-lg p-4 flex flex-col">
          <div className="flex-grow bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3 overflow-y-auto">
            {isRecording ? (
              <p className="text-gray-700">
                {transcript || "Recording in progress..."}
              </p>
            ) : (
              <p className="text-gray-400 italic">
                {transcript ? transcript : "Click 'Start Recording' to begin."}
              </p>
            )}
          </div>
          <Button 
            className="w-full" 
            onClick={handleSubmitTranscript}
            disabled={!transcript || isRecording || isLoading}
          >
            <Send className="mr-2 h-4 w-4" />
            {isLoading ? "Processing..." : "Submit Answer"}
          </Button>
        </div>
      </div>

      <div className="w-[40%] h-full bg-white flex flex-col border-l p-4">
        <div className="flex-grow overflow-y-auto space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-blue-800">
                Question {questionNumber} of {totalQuestions}
              </h3>
            </div>
            <p className="text-gray-800">{currentQuestion}</p>
          </div>

          {allQuestions.map((question, index) => {
            if (index < questionNumber && allFeedback[index]) {
              const isMinimized = minimizedAnswers[index];
              
              return (
                <div key={index} className="bg-gray-50 rounded-lg border border-gray-200">
                  <div 
                    className="p-3 flex justify-between items-center cursor-pointer bg-gray-100"
                    onClick={() => toggleAnswerMinimized(index)}
                  >
                    <h4 className="font-medium text-gray-700">Q{index + 1}: {question}</h4>
                    {isMinimized ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  
                  {!isMinimized && (
                    <div className="p-3">
                      <p className="text-gray-600 mb-2"><span className="font-medium">Your answer:</span> {allAnswers[index]}</p>
                      <p className="text-gray-800 bg-blue-50 p-2 rounded"><span className="font-medium">Feedback:</span> {allFeedback[index]}</p>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
          
          {isLoading && (
            <div className="text-center py-4 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-yellow-700 animate-pulse">
                Analyzing your answer and preparing the next question...
              </p>
            </div>
          )}
        </div>
        
        {currentFeedback && (
          <div className="mt-4">
            <Button 
              className="w-full" 
              onClick={handleNextQuestion}
              disabled={isLoading || isRecording}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Next Question
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Interview;
