import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const GAME_DURATION = 15000;
const DOT_INTERVAL = 800;
const DOT_LIFETIME = 1200;

const DOT_COLORS = [
  { color: '#FF3B3B', name: 'red', isTarget: true },
  { color: '#3B82F6', name: 'blue', isTarget: false },
  { color: '#4ADE80', name: 'green', isTarget: false },
  { color: '#FFD93D', name: 'yellow', isTarget: false },
  { color: '#A855F7', name: 'purple', isTarget: false },
  { color: '#FF6B35', name: 'orange', isTarget: false },
];

interface Dot {
  id: string;
  x: number;
  y: number;
  colorInfo: typeof DOT_COLORS[0];
  size: number;
}

const PLAY_AREA_TOP = 180;
const PLAY_AREA_BOTTOM = 100;
const DOT_SIZE_MIN = 40;
const DOT_SIZE_MAX = 60;

export default function ColorTapGame() {
  const insets = useSafeAreaInsets();
  const { setColorTapScore } = useGame();
  const [dots, setDots] = useState<Dot[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const scoreRef = useRef(0);
  const gameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progressWidth = useSharedValue(100);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const playAreaHeight = height - PLAY_AREA_TOP - PLAY_AREA_BOTTOM - insets.top - webTopInset - insets.bottom - webBottomInset;

  useEffect(() => {
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setGameStarted(true);
          return 0;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (gameTimerRef.current) clearTimeout(gameTimerRef.current);
      if (dotTimerRef.current) clearInterval(dotTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    progressWidth.value = withTiming(0, { duration: GAME_DURATION });

    tickTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    gameTimerRef.current = setTimeout(() => {
      setGameOver(true);
      if (dotTimerRef.current) clearInterval(dotTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      setColorTapScore(scoreRef.current);
    }, GAME_DURATION);

    dotTimerRef.current = setInterval(() => {
      spawnDots();
    }, DOT_INTERVAL);

    return () => {
      if (gameTimerRef.current) clearTimeout(gameTimerRef.current);
      if (dotTimerRef.current) clearInterval(dotTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, [gameStarted, gameOver]);

  const spawnDots = useCallback(() => {
    const numDots = Math.random() > 0.5 ? 2 : 1;
    const newDots: Dot[] = [];

    for (let i = 0; i < numDots; i++) {
      const size = DOT_SIZE_MIN + Math.random() * (DOT_SIZE_MAX - DOT_SIZE_MIN);
      const redChance = Math.random();
      const colorInfo = redChance > 0.55
        ? DOT_COLORS[0]
        : DOT_COLORS[Math.floor(1 + Math.random() * (DOT_COLORS.length - 1))];

      newDots.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        x: 20 + Math.random() * (width - 60 - size),
        y: 20 + Math.random() * (playAreaHeight - size - 20),
        colorInfo,
        size,
      });
    }

    setDots(prev => [...prev, ...newDots]);

    setTimeout(() => {
      setDots(prev => prev.filter(d => !newDots.find(nd => nd.id === d.id)));
    }, DOT_LIFETIME);
  }, [playAreaHeight]);

  const handleDotPress = (dot: Dot) => {
    if (dot.colorInfo.isTarget) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      scoreRef.current += 10;
      setScore(scoreRef.current);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      scoreRef.current = Math.max(0, scoreRef.current - 5);
      setScore(scoreRef.current);
      setMisses(prev => prev + 1);
    }
    setDots(prev => prev.filter(d => d.id !== dot.id));
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace('/game-whack-mole');
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as any,
  }));

  if (countdown > 0 && !gameStarted) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A0A1A', '#1A0510', '#0A0A1A']} style={StyleSheet.absoluteFill} />
        <View style={styles.countdownContainer}>
          <Text style={styles.gameLabel}>GAME 1</Text>
          <Text style={styles.gameName}>COLOR TAP</Text>
          <Text style={styles.gameRule}>Tap only the RED dots!</Text>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A0A1A', '#1A0510', '#0A0A1A']} style={StyleSheet.absoluteFill} />
        <View style={[styles.resultContainer, { paddingTop: insets.top + webTopInset }]}>
          <Animated.View entering={ZoomIn.duration(400)} style={styles.resultCard}>
            <Text style={styles.resultLabel}>COLOR TAP</Text>
            <Text style={styles.resultScore}>{score}</Text>
            <Text style={styles.resultPoints}>POINTS</Text>
            <View style={styles.resultStats}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accentGreen} />
                <Text style={styles.statValue}>{Math.floor(score / 10)}</Text>
                <Text style={styles.statLabel}>Hits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={20} color={Colors.danger} />
                <Text style={styles.statValue}>{misses}</Text>
                <Text style={styles.statLabel}>Misses</Text>
              </View>
            </View>
          </Animated.View>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [styles.nextButton, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={[Colors.accentOrange, '#FF8F35']}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>NEXT GAME</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A1A', '#1A0510', '#0A0A1A']} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>SCORE</Text>
          <Text style={styles.headerValue}>{score}</Text>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>TAP RED ONLY</Text>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressStyle]}>
              <LinearGradient
                colors={[Colors.accent, Colors.accentOrange]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerLabel}>TIME</Text>
          <Text style={styles.headerValue}>{timeLeft}s</Text>
        </View>
      </View>

      <View style={[styles.playArea, { height: playAreaHeight }]}>
        {dots.map(dot => (
          <DotComponent key={dot.id} dot={dot} onPress={handleDotPress} />
        ))}
      </View>
    </View>
  );
}

function DotComponent({ dot, onPress }: { dot: Dot; onPress: (dot: Dot) => void }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: dot.x,
          top: dot.y,
          width: dot.size,
          height: dot.size,
        },
        animStyle,
      ]}
    >
      <Pressable
        onPress={() => onPress(dot)}
        style={{
          width: dot.size,
          height: dot.size,
          borderRadius: dot.size / 2,
          backgroundColor: dot.colorInfo.color,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: dot.colorInfo.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 12,
          elevation: 8,
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  gameLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 4,
  },
  gameName: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 32,
    color: Colors.accent,
    letterSpacing: 2,
  },
  gameRule: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: 4,
  },
  countdownText: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 80,
    color: Colors.text,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
    gap: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  headerValue: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 22,
    color: Colors.text,
  },
  headerTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: Colors.accent,
    letterSpacing: 3,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  playArea: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,59,0.1)',
    overflow: 'hidden',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 30,
  },
  resultCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,59,59,0.2)',
  },
  resultLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 4,
  },
  resultScore: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 64,
    color: Colors.accent,
    marginTop: 8,
  },
  resultPoints: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 4,
    marginTop: -4,
  },
  resultStats: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 24,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 20,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  nextButtonText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 14,
    color: '#fff',
    letterSpacing: 3,
  },
});
