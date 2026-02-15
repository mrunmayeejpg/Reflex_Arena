import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const GAME_DURATION = 20000;
const GRID_COLS = 3;
const GRID_ROWS = 4;
const TOTAL_HOLES = GRID_COLS * GRID_ROWS;

interface Mole {
  index: number;
  id: string;
  duration: number;
}

export default function WhackMoleGame() {
  const insets = useSafeAreaInsets();
  const { setWhackMoleScore } = useGame();
  const [score, setScore] = useState(0);
  const [moles, setMoles] = useState<Mole[]>([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [whacked, setWhacked] = useState(0);
  const [missed, setMissed] = useState(0);
  const scoreRef = useRef(0);
  const whackedRef = useRef(0);
  const missedRef = useRef(0);

  const progressWidth = useSharedValue(100);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameStarted(true);
          return 0;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    progressWidth.value = withTiming(0, { duration: GAME_DURATION });

    const tickTimer = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    const gameTimer = setTimeout(() => {
      setGameOver(true);
      setWhackMoleScore(scoreRef.current);
    }, GAME_DURATION);

    let spawnSpeed = 800;
    let spawnTimer: ReturnType<typeof setTimeout>;

    const spawnMole = () => {
      if (gameOver) return;
      const availableIndices: number[] = [];
      for (let i = 0; i < TOTAL_HOLES; i++) {
        availableIndices.push(i);
      }

      const randIdx = Math.floor(Math.random() * availableIndices.length);
      const chosen = [availableIndices[randIdx]];


      const duration = 500 + Math.random() * 200;
      const newMoles: Mole[] = chosen.map(index => ({
        index,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        duration,
      }));

      setMoles(prev => [...prev, ...newMoles]);

      setTimeout(() => {
        setMoles(prev => {
          const remaining = prev.filter(m => !newMoles.find(nm => nm.id === m.id));
          const expiredUnwhacked = newMoles.filter(nm => prev.find(m => m.id === nm.id));
          if (expiredUnwhacked.length > 0) {
            missedRef.current += expiredUnwhacked.length;
            setMissed(missedRef.current);
          }
          return remaining;
        });
      }, duration);

      spawnSpeed = Math.max(500, spawnSpeed - 15);
      spawnTimer = setTimeout(spawnMole, spawnSpeed);
    };

    spawnTimer = setTimeout(spawnMole, 500);

    return () => {
      clearInterval(tickTimer);
      clearTimeout(gameTimer);
      clearTimeout(spawnTimer);
    };
  }, [gameStarted, gameOver]);

  const handleWhack = useCallback((mole: Mole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setScore(prev => {
  const newScore = prev + 10;
  scoreRef.current = newScore;
  return newScore;
});

setWhacked(prev => {
  const newVal = prev + 1;
  whackedRef.current = newVal;
  return newVal;
});

    setMoles(prev => prev.filter(m => m.id !== mole.id));
  }, []);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace('/game-reaction');
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as any,
  }));

  const holeSize = (width - 60 - (GRID_COLS - 1) * 12) / GRID_COLS;

  if (countdown > 0 && !gameStarted) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A0A1A', '#0A1A10', '#0A0A1A']} style={StyleSheet.absoluteFill} />
        <View style={styles.countdownContainer}>
          <Text style={styles.gameLabel}>GAME 2</Text>
          <Text style={styles.gameName}>WHACK-A-MOLE</Text>
          <Text style={styles.gameRule}>Tap the moles before they hide!</Text>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A0A1A', '#0A1A10', '#0A0A1A']} style={StyleSheet.absoluteFill} />
        <View style={[styles.resultContainer, { paddingTop: insets.top + webTopInset }]}>
          <Animated.View entering={ZoomIn.duration(400)} style={styles.resultCard}>
            <Text style={styles.resultLabel}>WHACK-A-MOLE</Text>
            <Text style={[styles.resultScore, { color: Colors.accentGreen }]}>{score}</Text>
            <Text style={styles.resultPoints}>POINTS</Text>
            <View style={styles.resultStats}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accentGreen} />
                <Text style={styles.statValue}>{whacked}</Text>
                <Text style={styles.statLabel}>Whacked</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={20} color={Colors.danger} />
                <Text style={styles.statValue}>{missed}</Text>
                <Text style={styles.statLabel}>Escaped</Text>
              </View>
            </View>
          </Animated.View>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [styles.nextButton, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={[Colors.accentBlue, '#5B9CF6']}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>FINAL GAME</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A1A', '#0A1A10', '#0A0A1A']} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>SCORE</Text>
          <Text style={styles.headerValue}>{score}</Text>
        </View>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: Colors.accentGreen }]}>WHACK THEM!</Text>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressStyle]}>
              <LinearGradient
                colors={[Colors.accentGreen, '#22C55E']}
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

      <View style={styles.gridContainer}>
        <View style={[styles.grid, { gap: 12 }]}>
          {Array.from({ length: TOTAL_HOLES }).map((_, index) => {
            const mole = moles.find(m => m.index === index);
            return (
              <HoleComponent
                key={index}
                size={holeSize}
                mole={mole || null}
                onWhack={handleWhack}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function HoleComponent({ size, mole, onWhack }: { size: number; mole: Mole | null; onWhack: (m: Mole) => void }) {
  return (
    <View style={[styles.hole, { width: size, height: size, borderRadius: size / 2 }]}>
      {mole && (
        <Pressable
          onPressIn={() => onWhack(mole)}
          hitSlop={20}
          style={StyleSheet.absoluteFill}
        >
          <View
            style={[
              styles.mole,
              {
                width: size - 12,
                height: size - 12,
                borderRadius: (size - 12) / 2,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="emoticon-angry"
              size={size * 0.45}
              color="#3D2200"
            />
          </View>
        </Pressable>
      )}
    </View>
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
    fontSize: 28,
    color: Colors.accentGreen,
    letterSpacing: 2,
  },
  gameRule: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 13,
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
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  hole: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: 'rgba(74, 222, 128, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mole: {
    backgroundColor: '#FFB347',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
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
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  resultLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 4,
  },
  resultScore: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 64,
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
