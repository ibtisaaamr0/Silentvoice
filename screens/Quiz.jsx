import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';

const QUESTIONS = [
  {
    question: "What does an open palm facing forward usually signify?",
    options: ["Stop / Hello", "Yes", "No", "Good job"],
    correct: 0,
  },
  {
    question: "Which gesture is commonly used for 'Good' or 'Like'?",
    options: ["Fist", "Thumb Up", "Open Palm", "Index Pointing"],
    correct: 1,
  },
  {
    question: "A closed fist held up often represents:",
    options: ["Solidarity / Strength", "Peace", "Hello", "Direction"],
    correct: 0,
  },
];

export default function Quiz({ navigation }) {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [selected, setSelected] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);

    const handleAnswer = (index) => {
        setSelected(index);
        const correct = index === QUESTIONS[currentQ].correct;
        setIsCorrect(correct);
        if (correct) setScore(score + 1);

        setTimeout(() => {
            if (currentQ < QUESTIONS.length - 1) {
                setCurrentQ(currentQ + 1);
                setSelected(null);
                setIsCorrect(null);
            } else {
                setShowScore(true);
            }
        }, 1000);
    };

    const restart = () => {
        setScore(0);
        setCurrentQ(0);
        setShowScore(false);
        setSelected(null);
        setIsCorrect(null);
    };

    if (showScore) {
        return (
            <LinearGradient colors={['#FF6B6B', '#556270']} style={styles.container}>
                <Animatable.View animation="zoomIn" style={styles.scoreCard}>
                    <Text style={styles.scoreTitle}>Quiz Completed!</Text>
                    <Text style={styles.scoreText}>Your Score: {score} / {QUESTIONS.length}</Text>
                    <Pressable onPress={restart} style={styles.restartBtn}>
                        <Text style={styles.btnText}>Restart Quiz</Text>
                    </Pressable>
                    <Pressable onPress={() => navigation.goBack()} style={[styles.restartBtn, {backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333', marginTop: 10}]}>
                        <Text style={[styles.btnText, {color: '#333'}]}>Back to Home</Text>
                    </Pressable>
                </Animatable.View>
            </LinearGradient>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#FF6A3D', '#FF8E53']} style={styles.header}>
                <Text style={styles.headerTitle}>Knowledge Quiz</Text>
                <Text style={styles.progress}>Question {currentQ + 1} / {QUESTIONS.length}</Text>
            </LinearGradient>

            <View style={styles.card}>
                <Text style={styles.question}>{QUESTIONS[currentQ].question}</Text>

                <View style={styles.options}>
                    {QUESTIONS[currentQ].options.map((opt, index) => {
                        let bgColor = '#f0f0f0';
                        if (selected === index) {
                            bgColor = isCorrect ? '#4CAF50' : '#F44336';
                        }

                        return (
                            <Pressable 
                                key={index} 
                                style={[styles.option, { backgroundColor: bgColor }]}
                                onPress={() => !selected && handleAnswer(index)}
                            >
                                <Text style={[styles.optionText, selected === index && {color: '#fff'}]}>{opt}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 30,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  progress: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  card: {
    margin: 20,
    marginTop: -30,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 30,
    lineHeight: 28,
  },
  options: {
    gap: 15,
  },
  option: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 16,
    color: '#444',
  },
  scoreCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 25,
    alignItems: 'center',
    width: '80%',
  },
  scoreTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 20,
    color: '#FF6B35',
    marginBottom: 30,
  },
  restartBtn: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
