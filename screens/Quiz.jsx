import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import {WebView} from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const {width} = Dimensions.get('window');
const BACKEND = 'http://192.168.100.190:8080';
const HISTORY_KEY = 'quiz_history';
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// ─── Theme ────────────────────────────────────────────────────────────────────
const DARK = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  sub: '#94A3B8',
  border: '#334155',
};
const LIGHT = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  sub: '#64748B',
  border: '#E2E8F0',
};

// ─── Signs ────────────────────────────────────────────────────────────────────
const ALL_SIGNS = [
  // LOW — single words (25)
  {label: 'Allow', cat: 'actions', file: 'allow', level: 'low'},
  {label: 'Clean', cat: 'actions', file: 'clean', level: 'low'},
  {label: 'Eat', cat: 'actions', file: 'eat', level: 'low'},
  {label: 'Meet', cat: 'actions', file: 'meet', level: 'low'},
  {label: 'Sleep', cat: 'actions', file: 'sleep', level: 'low'},
  {label: 'Wait', cat: 'actions', file: 'wait', level: 'low'},
  {label: 'Wake Up', cat: 'actions', file: 'wakeup', level: 'low'},
  {label: 'Friend', cat: 'objects', file: 'friend', level: 'low'},
  {label: 'Home', cat: 'objects', file: 'home', level: 'low'},
  {label: 'Water', cat: 'objects', file: 'water', level: 'low'},
  {
    label: 'Afternoon',
    cat: 'time related words',
    file: 'afternoon',
    level: 'low',
  },
  {label: 'Day', cat: 'time related words', file: 'day', level: 'low'},
  {label: 'Evening', cat: 'time related words', file: 'evening', level: 'low'},
  {label: 'Morning', cat: 'time related words', file: 'morning', level: 'low'},
  {label: 'Night', cat: 'time related words', file: 'night', level: 'low'},
  {label: 'Best', cat: 'other', file: 'best', level: 'low'},
  {label: 'Fail', cat: 'other', file: 'fail', level: 'low'},
  {label: 'Fine', cat: 'other', file: 'fine', level: 'low'},
  {label: 'Free', cat: 'other', file: 'free', level: 'low'},
  {label: 'Hi', cat: 'greetings and daily use words', file: 'hi', level: 'low'},
  {
    label: 'Name',
    cat: 'greetings and daily use words',
    file: 'name',
    level: 'low',
  },
  {
    label: 'Salam',
    cat: 'greetings and daily use words',
    file: 'salam',
    level: 'low',
  },
  {
    label: 'Sorry',
    cat: 'greetings and daily use words',
    file: 'sorry',
    level: 'low',
  },
  {
    label: 'Sun',
    cat: 'greetings and daily use words',
    file: 'sun',
    level: 'low',
  },
  {
    label: 'Welcome',
    cat: 'greetings and daily use words',
    file: 'welcome',
    level: 'low',
  },

  // MEDIUM — cities + short phrases (25)
  {label: 'Faisalabad', cat: 'cities', file: 'faislabad', level: 'medium'},
  {label: 'Islamabad', cat: 'cities', file: 'islamabad', level: 'medium'},
  {label: 'Karachi', cat: 'cities', file: 'karachi', level: 'medium'},
  {label: 'Lahore', cat: 'cities', file: 'lahore', level: 'medium'},
  {label: 'Multan', cat: 'cities', file: 'multan', level: 'medium'},
  {label: 'Peshawar', cat: 'cities', file: 'peshawar', level: 'medium'},
  {label: 'Rawalpindi', cat: 'cities', file: 'rawalpindi', level: 'medium'},
  {
    label: 'Thank You',
    cat: 'greetings and daily use words',
    file: 'thank you',
    level: 'medium',
  },
  {
    label: 'Thank You',
    cat: 'greetings and daily use words',
    file: 'thankyou',
    level: 'medium',
  },
  {
    label: 'W Salam',
    cat: 'greetings and daily use words',
    file: 'wsalam',
    level: 'medium',
  },
  {
    label: 'Wedding / Marriage',
    cat: 'other',
    file: 'wedding or marriage',
    level: 'medium',
  },
  {label: 'Hi There', cat: '30 phrases', file: 'hi there', level: 'medium'},
  {
    label: 'Good Morning',
    cat: '30 phrases',
    file: 'good morning',
    level: 'medium',
  },
  {label: 'Good Night', cat: '30 phrases', file: 'good night', level: 'medium'},
  {
    label: 'Good Afternoon',
    cat: '30 phrases',
    file: 'good afternoon',
    level: 'medium',
  },
  {
    label: 'Good Evening',
    cat: '30 phrases',
    file: 'good evening',
    level: 'medium',
  },
  {label: 'Good Day', cat: '30 phrases', file: 'good day', level: 'medium'},
  {label: 'Good Bye', cat: '30 phrases', file: 'good bye', level: 'medium'},
  {label: 'Please', cat: '30 phrases', file: 'please', level: 'medium'},
  {
    label: "Let's Start Now",
    cat: '30 phrases',
    file: 'lets start now',
    level: 'medium',
  },
  {label: 'I Am Fine', cat: '30 phrases', file: 'i am fine', level: 'medium'},
  {
    label: 'How Are You',
    cat: '30 phrases',
    file: 'how are you',
    level: 'medium',
  },
  {
    label: 'Welcome Here',
    cat: '30 phrases',
    file: 'welcome here',
    level: 'medium',
  },
  {label: 'My Name Is', cat: '30 phrases', file: 'my name is', level: 'medium'},
  {
    label: 'I Am Hungry',
    cat: '30 phrases',
    file: 'i am hungry',
    level: 'medium',
  },

  // HIGH — complex phrases (24)
  {
    label: 'Aoa Dear Brothers And Sisters',
    cat: '30 phrases',
    file: 'aoa dear brothers and sisters',
    level: 'high',
  },
  {
    label: 'Are You Busy Today',
    cat: '30 phrases',
    file: 'are you busy today',
    level: 'high',
  },
  {
    label: 'Can We Discuss This Later',
    cat: '30 phrases',
    file: 'can we discuss this later',
    level: 'high',
  },
  {
    label: 'Can You Help Me',
    cat: '30 phrases',
    file: 'can you help me',
    level: 'high',
  },
  {
    label: 'Can You Repeat That',
    cat: '30 phrases',
    file: 'can you repeat that',
    level: 'high',
  },
  {
    label: 'Do You Understand',
    cat: '30 phrases',
    file: 'do you understand',
    level: 'high',
  },
  {
    label: 'Happy Anniversary',
    cat: '30 phrases',
    file: 'happy anniversay',
    level: 'high',
  },
  {
    label: 'Happy Birthday',
    cat: '30 phrases',
    file: 'happy birthday',
    level: 'high',
  },
  {
    label: 'Happy To Meet You',
    cat: '30 phrases',
    file: 'happy to meet you',
    level: 'high',
  },
  {
    label: 'Happy To Meet You Too',
    cat: '30 phrases',
    file: 'happy to meet you too',
    level: 'high',
  },
  {
    label: 'Hey Guys Hope You Are Doing Great',
    cat: '30 phrases',
    file: 'hey guys hope you are doing great',
    level: 'high',
  },
  {
    label: 'How Are You, Alhamdulillah',
    cat: '30 phrases',
    file: 'how are you  i am good alhamdulilah',
    level: 'high',
  },
  {
    label: 'How Did Your Meeting Go',
    cat: '30 phrases',
    file: 'how did your meeting go',
    level: 'high',
  },
  {
    label: 'I Agree With Your Idea',
    cat: '30 phrases',
    file: 'i agree with your idea',
    level: 'high',
  },
  {
    label: 'I Am Feeling Stressed Today',
    cat: '30 phrases',
    file: 'i am feeling stressed today',
    level: 'high',
  },
  {
    label: 'I Am Going To School / Work',
    cat: '30 phrases',
    file: 'i am going to school or work',
    level: 'high',
  },
  {
    label: "I Don't Understand",
    cat: '30 phrases',
    file: 'i dont understand',
    level: 'high',
  },
  {
    label: 'I Have A Different Opinion',
    cat: '30 phrases',
    file: 'i have a different opinion',
    level: 'high',
  },
  {
    label: 'I Need More Time To Think',
    cat: '30 phrases',
    file: 'i need more time think',
    level: 'high',
  },
  {
    label: "Let's Eat Together",
    cat: '30 phrases',
    file: 'lets eat together',
    level: 'high',
  },
  {
    label: 'What Are Your Plans For Tomorrow',
    cat: '30 phrases',
    file: 'what are your plans for tomorrow',
    level: 'high',
  },
  {
    label: 'What Is Your Name',
    cat: '30 phrases',
    file: 'what is your name',
    level: 'high',
  },
  {
    label: 'What Time Is It',
    cat: '30 phrases',
    file: 'what time is it',
    level: 'high',
  },
  {
    label: 'Where Are You Going',
    cat: '30 phrases',
    file: 'where are you going',
    level: 'high',
  },
];

const LEVEL_META = {
  low: {
    label: 'Low',
    subtitle: 'Simple single words',
    gradient: ['#059669', '#10B981'],
    emoji: '🌱',
    count: 25,
  },
  medium: {
    label: 'Medium',
    subtitle: 'Short phrases',
    gradient: ['#D97706', '#F59E0B'],
    emoji: '⚡',
    count: 25,
  },
  high: {
    label: 'High',
    subtitle: 'Complex phrases',
    gradient: ['#DC2626', '#EF4444'],
    emoji: '🔥',
    count: 24,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

function buildOptions(correct) {
  const pool = shuffle(ALL_SIGNS.filter(s => s.label !== correct.label));
  return shuffle([correct, ...pool.slice(0, 3)]);
}

function buildQuestions(level) {
  return shuffle(ALL_SIGNS.filter(s => s.level === level)).map(sign => ({
    sign,
    options: buildOptions(sign),
    correctLabel: sign.label,
  }));
}

function videoUrl(sign) {
  return `${BACKEND}/video/${encodeURIComponent(sign.cat)}/${encodeURIComponent(
    sign.file,
  )}.mp4`;
}

function videoHtml(url) {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;display:flex;align-items:center;justify-content:center;height:100vh}video{width:100%;height:100%;object-fit:contain}</style></head><body><video src="${url}" autoplay loop playsinline controls></video></body></html>`;
}

async function saveResult(level, score, total) {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      time: new Date().toLocaleTimeString('en-PK', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      level,
      score,
      total,
      pct: Math.round((score / total) * 100),
    };
    const updated = [entry, ...history].slice(0, 10);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

async function loadHistory() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function starsForPct(pct) {
  if (pct >= 80) return 3;
  if (pct >= 50) return 2;
  if (pct >= 30) return 1;
  return 0;
}

function performanceLabel(pct) {
  if (pct >= 80) return 'Outstanding!';
  if (pct >= 60) return 'Well Done!';
  if (pct >= 40) return 'Keep Going!';
  return "Don't Give Up!";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Quiz({navigation}) {
  const isDarkMode = useSelector(state => state.theme.isDarkMode);
  const C = isDarkMode ? DARK : LIGHT;

  const [phase, setPhase] = useState('select');
  const [level, setLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qi, setQi] = useState(0);
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [pickedIdx, setPickedIdx] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [history, setHistory] = useState([]);
  const [finalScore, setFinalScore] = useState(0);
  const scoreRef = useRef(0);
  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const startQuiz = lvl => {
    scoreRef.current = 0;
    setScoreDisplay(0);
    setFinalScore(0);
    setLevel(lvl);
    setQuestions(buildQuestions(lvl));
    setQi(0);
    setPickedIdx(null);
    setAnswered(false);
    setPhase('quiz');
  };

  const handleAnswer = idx => {
    if (answered) return;
    const q = questions[qi];
    const correct = q.options[idx].label === q.correctLabel;
    setPickedIdx(idx);
    setAnswered(true);
    if (correct) {
      scoreRef.current += 1;
      setScoreDisplay(scoreRef.current);
    }
    setTimeout(async () => {
      if (qi < questions.length - 1) {
        setQi(i => i + 1);
        setPickedIdx(null);
        setAnswered(false);
      } else {
        const fs = scoreRef.current;
        setFinalScore(fs);
        const h = await saveResult(level, fs, questions.length);
        setHistory(h);
        setPhase('result');
      }
    }, 1400);
  };

  const optionState = idx => {
    if (!answered || pickedIdx === null) return 'idle';
    const q = questions[qi];
    if (q.options[idx].label === q.correctLabel) return 'correct';
    if (idx === pickedIdx) return 'wrong';
    return 'dimmed';
  };

  // ── Level Select ─────────────────────────────────────────────────────────────
  if (phase === 'select') {
    const bestPct = lvl => {
      const entries = history.filter(h => h.level === lvl);
      return entries.length ? Math.max(...entries.map(e => e.pct)) : null;
    };

    return (
      <View style={[s.fill, {backgroundColor: C.bg}]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={s.topHeader}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={s.topHeaderTitle}>PSL Sign Quiz</Text>
          <View style={{width: 40}} />
        </LinearGradient>

        <ScrollView
          contentContainerStyle={s.selectBody}
          showsVerticalScrollIndicator={false}>
          <Animatable.View
            animation="fadeInDown"
            duration={550}
            style={s.intro}>
            <Text style={s.introEmoji}>🧠</Text>
            <Text style={[s.introTitle, {color: C.text}]}>
              Test Your Knowledge
            </Text>
            <Text style={[s.introSub, {color: C.sub}]}>
              Watch the sign video and pick the correct answer
            </Text>
          </Animatable.View>

          {['low', 'medium', 'high'].map((lvl, i) => {
            const meta = LEVEL_META[lvl];
            const best = bestPct(lvl);
            return (
              <Animatable.View
                key={lvl}
                animation="fadeInUp"
                delay={i * 100}
                duration={480}
                style={s.levelCardShadow}>
                <Pressable
                  onPress={() => startQuiz(lvl)}
                  android_ripple={{
                    color: 'rgba(255,255,255,0.2)',
                    borderless: false,
                  }}>
                  <LinearGradient colors={meta.gradient} style={s.levelCard}>
                    <Text style={s.levelEmoji}>{meta.emoji}</Text>
                    <View style={s.levelInfo}>
                      <Text style={s.levelLabel}>{meta.label}</Text>
                      <Text style={s.levelSubtitle}>{meta.subtitle}</Text>
                    </View>
                    <View style={s.levelRight}>
                      <Text style={s.levelCount}>{meta.count}</Text>
                      <Text style={s.levelCountSub}>signs</Text>
                      {best !== null && (
                        <View style={s.bestBadge}>
                          <Text style={s.bestText}>Best {best}%</Text>
                        </View>
                      )}
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={26}
                      color="rgba(255,255,255,0.75)"
                    />
                  </LinearGradient>
                </Pressable>
              </Animatable.View>
            );
          })}

          {history.length > 0 && (
            <Animatable.View
              animation="fadeIn"
              delay={450}
              style={{marginTop: 8}}>
              <Text style={[s.sectionTitle, {color: C.text}]}>
                Recent History
              </Text>
              {history.slice(0, 5).map(h => (
                <HistoryRow key={h.id} h={h} C={C} />
              ))}
            </Animatable.View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = questions[qi];
    const progressPct = (qi / questions.length) * 100;

    return (
      <View style={[s.fill, {backgroundColor: C.bg}]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={s.quizHeader}>
          <Pressable onPress={() => setPhase('select')} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={s.quizHeaderCenter}>
            <Text style={s.quizQ}>
              Q {qi + 1} / {questions.length}
            </Text>
            <Text style={s.quizLevelTag}>
              {LEVEL_META[level]?.emoji} {LEVEL_META[level]?.label}
            </Text>
          </View>
          <View style={s.quizScoreBox}>
            <Text style={s.quizScoreNum}>{scoreDisplay}</Text>
            <Text style={s.quizScoreSub}>pts</Text>
          </View>
        </LinearGradient>

        <View style={[s.progressBg, {backgroundColor: C.border}]}>
          <View style={[s.progressFill, {width: `${progressPct}%`}]} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.quizBody}>
          <View style={s.videoCard}>
            <WebView
              source={{html: videoHtml(videoUrl(q.sign))}}
              style={s.webview}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback
              javaScriptEnabled
              scrollEnabled={false}
            />
          </View>

          <Text style={[s.prompt, {color: C.sub}]}>What sign is this?</Text>

          <Animatable.View
            key={`opts-${qi}`}
            animation="fadeInUp"
            duration={350}>
            {q.options.map((opt, idx) => {
              const state = optionState(idx);
              const bg =
                state === 'correct'
                  ? '#10B981'
                  : state === 'wrong'
                  ? '#EF4444'
                  : C.card;
              const txtColor =
                state === 'correct' || state === 'wrong' ? '#fff' : C.text;
              const border =
                state === 'correct'
                  ? '#10B981'
                  : state === 'wrong'
                  ? '#EF4444'
                  : C.border;
              const opacity = state === 'dimmed' ? 0.38 : 1;

              return (
                <Pressable
                  key={idx}
                  onPress={() => handleAnswer(idx)}
                  disabled={answered}
                  style={({pressed}) => [
                    s.optionBtn,
                    {
                      backgroundColor: bg,
                      borderColor: border,
                      opacity: pressed && !answered ? 0.7 : opacity,
                    },
                  ]}>
                  <View
                    style={[
                      s.letterCircle,
                      {
                        backgroundColor:
                          state === 'idle'
                            ? '#6366F118'
                            : 'rgba(255,255,255,0.22)',
                      },
                    ]}>
                    <Text
                      style={[
                        s.letterText,
                        {color: state === 'idle' ? '#6366F1' : '#fff'},
                      ]}>
                      {OPTION_LETTERS[idx]}
                    </Text>
                  </View>
                  <Text
                    style={[s.optionText, {color: txtColor, flex: 1}]}
                    numberOfLines={2}>
                    {opt.label}
                  </Text>
                  {state === 'correct' && (
                    <MaterialIcons name="check-circle" size={22} color="#fff" />
                  )}
                  {state === 'wrong' && (
                    <MaterialIcons name="cancel" size={22} color="#fff" />
                  )}
                </Pressable>
              );
            })}
          </Animatable.View>
        </ScrollView>
      </View>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────────
  const pct = questions.length
    ? Math.round((finalScore / questions.length) * 100)
    : 0;
  const stars = starsForPct(pct);

  return (
    <View style={[s.fill, {backgroundColor: C.bg}]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={s.resultTopHeader}>
        <Text style={s.resultTopTitle}>Quiz Complete!</Text>
        <Text style={s.resultTopSub}>
          {LEVEL_META[level]?.emoji} {LEVEL_META[level]?.label} Level
        </Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.resultBody}>
        <Animatable.View
          animation="zoomIn"
          duration={550}
          style={[s.scoreCard, {backgroundColor: C.card}]}>
          <View style={s.starsRow}>
            {[0, 1, 2].map(i => (
              <MaterialIcons
                key={i}
                name={i < stars ? 'star' : 'star-border'}
                size={42}
                color={i < stars ? '#F59E0B' : C.border}
              />
            ))}
          </View>

          <Text style={[s.scoreBig, {color: C.text}]}>
            {finalScore}
            <Text style={[s.scoreOf, {color: C.sub}]}>/{questions.length}</Text>
          </Text>
          <Text style={[s.scorePct, {color: '#6366F1'}]}>{pct}%</Text>
          <Text style={[s.scorePerfLabel, {color: C.sub}]}>
            {performanceLabel(pct)}
          </Text>

          <View style={[s.divider, {backgroundColor: C.border}]} />

          <View style={s.statsRow}>
            {[
              {val: finalScore, color: '#10B981', label: 'Correct'},
              {
                val: questions.length - finalScore,
                color: '#EF4444',
                label: 'Wrong',
              },
              {val: questions.length, color: '#6366F1', label: 'Total'},
            ].map((st, i, arr) => (
              <React.Fragment key={st.label}>
                <View style={s.stat}>
                  <Text style={[s.statVal, {color: st.color}]}>{st.val}</Text>
                  <Text style={[s.statLabel, {color: C.sub}]}>{st.label}</Text>
                </View>
                {i < arr.length - 1 && (
                  <View style={[s.statDivider, {backgroundColor: C.border}]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={280} style={s.resultBtns}>
          <Pressable
            onPress={() => startQuiz(level)}
            style={{borderRadius: 16, overflow: 'hidden'}}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={s.primaryBtn}>
              <MaterialIcons name="replay" size={20} color="#fff" />
              <Text style={s.primaryBtnText}>Play Again</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => setPhase('select')}
            style={[s.secondaryBtn, {borderColor: '#6366F1'}]}>
            <MaterialIcons name="tune" size={20} color="#6366F1" />
            <Text style={[s.secondaryBtnText, {color: '#6366F1'}]}>
              Change Level
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[s.secondaryBtn, {borderColor: C.border}]}>
            <MaterialIcons name="home" size={20} color={C.sub} />
            <Text style={[s.secondaryBtnText, {color: C.sub}]}>
              Back to Dashboard
            </Text>
          </Pressable>
        </Animatable.View>

        {history.length > 0 && (
          <Animatable.View animation="fadeIn" delay={500}>
            <Text style={[s.sectionTitle, {color: C.text}]}>Quiz History</Text>
            {history.map(h => (
              <HistoryRow key={h.id} h={h} C={C} />
            ))}
          </Animatable.View>
        )}
      </ScrollView>
    </View>
  );
}

function HistoryRow({h, C}) {
  const meta = LEVEL_META[h.level];
  return (
    <View
      style={[s.historyRow, {backgroundColor: C.card, borderColor: C.border}]}>
      <View
        style={[
          s.historyDot,
          {backgroundColor: meta?.gradient[0] ?? '#6366F1'},
        ]}
      />
      <View style={{flex: 1}}>
        <Text style={[s.historyLevel, {color: C.text}]}>
          {meta?.label ?? h.level} Level
        </Text>
        <Text style={[s.historyDate, {color: C.sub}]}>
          {h.date} · {h.time}
        </Text>
      </View>
      <Text
        style={[s.historyScore, {color: h.pct >= 60 ? '#10B981' : '#EF4444'}]}>
        {h.score}/{h.total} · {h.pct}%
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  fill: {flex: 1},

  // shared
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  historyDot: {width: 10, height: 10, borderRadius: 5, marginRight: 12},
  historyLevel: {fontSize: 14, fontWeight: '600'},
  historyDate: {fontSize: 12, marginTop: 2},
  historyScore: {fontSize: 13, fontWeight: '700'},

  // level select
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  topHeaderTitle: {fontSize: 20, fontWeight: '700', color: '#fff'},
  selectBody: {padding: 20, paddingBottom: 40},
  intro: {alignItems: 'center', marginBottom: 28},
  introEmoji: {fontSize: 56, marginBottom: 10},
  introTitle: {fontSize: 24, fontWeight: '800', marginBottom: 6},
  introSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  levelCardShadow: {
    marginBottom: 16,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 5},
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  levelEmoji: {fontSize: 36, marginRight: 14},
  levelInfo: {flex: 1},
  levelLabel: {fontSize: 22, fontWeight: '800', color: '#fff'},
  levelSubtitle: {fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 3},
  levelRight: {alignItems: 'center', marginRight: 10},
  levelCount: {fontSize: 28, fontWeight: '900', color: '#fff'},
  levelCountSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '500',
  },
  bestBadge: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  bestText: {fontSize: 11, color: '#fff', fontWeight: '700'},

  // quiz header
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  quizHeaderCenter: {flex: 1, alignItems: 'center'},
  quizQ: {fontSize: 16, fontWeight: '700', color: '#fff'},
  quizLevelTag: {fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 2},
  quizScoreBox: {alignItems: 'center', minWidth: 40},
  quizScoreNum: {fontSize: 22, fontWeight: '900', color: '#fff'},
  quizScoreSub: {fontSize: 11, color: 'rgba(255,255,255,0.68)', marginTop: -2},
  progressBg: {height: 4},
  progressFill: {height: 4, backgroundColor: '#C8E265'},

  // quiz body
  quizBody: {padding: 16, paddingBottom: 32},
  videoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 220,
    marginBottom: 14,
    backgroundColor: '#000',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
  },
  webview: {flex: 1},
  videoLoader: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  videoLoaderText: {color: '#94A3B8', marginTop: 10, fontSize: 14},
  prompt: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  letterCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  letterText: {fontSize: 14, fontWeight: '800'},
  optionText: {fontSize: 15, fontWeight: '500'},

  // results
  resultTopHeader: {
    paddingTop: 70,
    paddingBottom: 40,
    alignItems: 'center',
  },
  resultTopTitle: {fontSize: 30, fontWeight: '900', color: '#fff'},
  resultTopSub: {fontSize: 15, color: 'rgba(255,255,255,0.82)', marginTop: 6},
  resultBody: {padding: 20, paddingBottom: 40},
  scoreCard: {
    borderRadius: 24,
    padding: 28,
    marginTop: -28,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 6},
  },
  starsRow: {flexDirection: 'row', gap: 4, marginBottom: 18},
  scoreBig: {fontSize: 68, fontWeight: '900', lineHeight: 76},
  scoreOf: {fontSize: 34, fontWeight: '600'},
  scorePct: {fontSize: 26, fontWeight: '800', marginTop: 2},
  scorePerfLabel: {fontSize: 16, marginTop: 8, marginBottom: 4},
  divider: {height: 1, width: '100%', marginVertical: 18},
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {alignItems: 'center'},
  statVal: {fontSize: 28, fontWeight: '900'},
  statLabel: {fontSize: 12, marginTop: 2, fontWeight: '500'},
  statDivider: {width: 1, height: 44},
  resultBtns: {marginTop: 22, gap: 12},
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  primaryBtnText: {fontSize: 16, fontWeight: '700', color: '#fff'},
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  secondaryBtnText: {fontSize: 16, fontWeight: '600'},
});