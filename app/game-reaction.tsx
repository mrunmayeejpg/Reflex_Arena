import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import * as Haptics from 'expo-haptics';

const TOTAL_ROUNDS = 5;

type GamePhase = 'countdown' | 'waiting' | 'ready' | 'tapped' | 'too-early' | 'done';

export default function ReactionGame() {
  const insets = useSafeAreaInsets();
  const { setReactionScore } = useGame();
  const [phase, setPhase] = useState<GamePhase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [round, setRound] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentReaction, setCurrentReaction] = useState(0);
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          startRound();
          return 0;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return prev - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === 'ready') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        true
      );
    }
  }, [phase]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const startRound = () => {
    setPhase('waiting');
    const delay = 1500 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      setPhase('ready');
      startTimeRef.current = Date.now();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, delay);
  };

  const handleTap = () => {
    if (phase === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPhase('too-early');
      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          finishGame([...reactionTimes, 999]);
        } else {
          setRound(prev => prev + 1);
          startRound();
        }
      }, 1500);
      return;
    }

    if (phase === 'ready') {
      const reaction = Date.now() - startTimeRef.current;
      setCurrentReaction(reaction);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newTimes = [...reactionTimes, reaction];
      setReactionTimes(newTimes);
      setPhase('tapped');

      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          finishGame(newTimes);
        } else {
          setRound(prev => prev + 1);
          startRound();
        }
      }, 1500);
    }
  };

  const finishGame = (times: number[]) => {
    setPhase('done');
    const validTimes = times.filter(t => t < 999);
    const avgTime = validTimes.length > 0
      ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
      : 999;

    let reactionScore = 0;
    if (avgTime < 200) reactionScore = 100;
    else if (avgTime < 250) reactionScore = 85;
    else if (avgTime < 300) reactionScore = 70;
    else if (avgTime < 350) reactionScore = 55;
    else if (avgTime < 400) reactionScore = 40;
    else if (avgTime < 500) reactionScore = 25;
    else reactionScore = 10;

    setReactionScore(reactionScore);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace('/results');
  };

  const getAvgReaction = () => {
    const validTimes = reactionTimes.filter(t => t < 999);
    if (validTimes.length === 0) return 'N/A';
    return Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length) + 'ms';
  };

  const getBestReaction = () => {
    const validTimes = reactionTimes.filter(t => t < 999);
    if (validTimes.length === 0) return 'N/A';
    return Math.min(...validTimes) + 'ms';
  };

  if (phase === 'countdown') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A0A1A', '#0A0A2A', '#0A0A1A']} style={StyleSheet.absoluteFill} />
        <View style={styles.countdownContainer}>
          <Text style={styles.gameLabel}>GAME 3</Text>
          <Text style={styles.gameName}>REACTION SPEED</Text>
          <Text style={styles.gameRule}>Tap when the screen turns GREEN!</Text>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A0A1A', '#0A0A2A', '#0A0A1A']} style={StyleSheet.absoluteFill} />
        <View style={[styles.resultContainer, { paddingTop: insets.top + webTopInset }]}>
          <Animated.View entering={ZoomIn.duration(400)} style={styles.resultCard}>
            <Text style={styles.resultLabel}>REACTION SPEED</Text>
            <Text style={[styles.resultScoreMain, { color: Colors.accentBlue }]}>{getAvgReaction()}</Text>
            <Text style={styles.resultPoints}>AVERAGE</Text>
            <View style={styles.resultStats}>
              <View style={styles.statItem}>
                <Ionicons name="flash" size={20} color={Colors.accentYellow} />
                <Text style={styles.statValue}>{getBestReaction()}</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="refresh" size={20} color={Colors.accentBlue} />
                <Text style={styles.statValue}>{TOTAL_ROUNDS}</Text>
                <Text style={styles.statLabel}>Rounds</Text>
              </View>
            </View>

            <View style={styles.roundsList}>
              {reactionTimes.map((time, i) => (
                <View key={i} style={styles.roundRow}>
                  <Text style={styles.roundLabel}>Round {i + 1}</Text>
                  <Text style={[styles.roundTime, time >= 999 && { color: Colors.danger }]}>
                    {time >= 999 ? 'TOO EARLY' : `${time}ms`}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [styles.nextButton, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={[Colors.accentPurple, '#C084FC']}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>SEE RESULTS</Text>
              <Ionicons name="trophy" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  const bgColor = phase === 'waiting' ? '#1A0A0A' : phase === 'ready' ? '#0A2A0A' : phase === 'too-early' ? '#2A0A0A' : '#0A1A2A';

  return (
    <Pressable style={styles.container} onPress={handleTap}>
      <LinearGradient
        colors={
          phase === 'ready'
            ? ['#0A2A0A', '#0A3A0A', '#0A2A0A']
            : phase === 'too-early'
            ? ['#2A0A0A', '#3A0A0A', '#2A0A0A']
            : phase === 'tapped'
            ? ['#0A1A2A', '#0A2A3A', '#0A1A2A']
            : ['#1A0A0A', '#2A0A0A', '#1A0A0A']
        }
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.tapContent, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.roundIndicator}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.roundDot,
                i < round && { backgroundColor: Colors.accentBlue },
                i === round && { backgroundColor: Colors.text, transform: [{ scale: 1.3 }] },
              ]}
            />
          ))}
        </View>

        {phase === 'waiting' && (
          <View style={styles.phaseContent}>
            <Ionicons name="hourglass" size={60} color={Colors.accent} />
            <Text style={styles.phaseTitle}>WAIT...</Text>
            <Text style={styles.phaseSubtitle}>Don't tap yet!</Text>
          </View>
        )}

        {phase === 'ready' && (
          <View style={styles.phaseContent}>
            <Animated.View style={pulseStyle}>
              <Ionicons name="flash" size={80} color={Colors.accentGreen} />
            </Animated.View>
            <Text style={[styles.phaseTitle, { color: Colors.accentGreen }]}>TAP NOW!</Text>
          </View>
        )}

        {phase === 'tapped' && (
          <View style={styles.phaseContent}>
            <Ionicons name="checkmark-circle" size={60} color={Colors.accentBlue} />
            <Text style={styles.reactionTime}>{currentReaction}ms</Text>
            <Text style={styles.phaseSubtitle}>
              {currentReaction < 200 ? 'Incredible!' : currentReaction < 300 ? 'Fast!' : currentReaction < 400 ? 'Good' : 'Keep trying!'}
            </Text>
          </View>
        )}

        {phase === 'too-early' && (
          <View style={styles.phaseContent}>
            <Ionicons name="close-circle" size={60} color={Colors.danger} />
            <Text style={[styles.phaseTitle, { color: Colors.danger }]}>TOO EARLY!</Text>
            <Text style={styles.phaseSubtitle}>Wait for green</Text>
          </View>
        )}
      </View>
    </Pressable>
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
    color: Colors.accentBlue,
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
  tapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  roundIndicator: {
    flexDirection: 'row',
    gap: 10,
    position: 'absolute',
    top: 100,
  },
  roundDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
  },
  phaseContent: {
    alignItems: 'center',
    gap: 16,
  },
  phaseTitle: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 36,
    color: Colors.accent,
    letterSpacing: 4,
  },
  phaseSubtitle: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  reactionTime: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 56,
    color: Colors.accentBlue,
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
    padding: 28,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  resultLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 4,
  },
  resultScoreMain: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 48,
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
    marginTop: 20,
    gap: 24,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 18,
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
  roundsList: {
    width: '100%',
    marginTop: 20,
    gap: 8,
  },
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  roundLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  roundTime: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13,
    color: Colors.accentBlue,
    letterSpacing: 1,
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
