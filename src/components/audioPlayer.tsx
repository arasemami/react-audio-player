import React, { useRef, useState, useEffect } from 'react';
import audioEventTarget from './audioEvents';
import { Icon } from '@iconify/react';
import './AudioPlayer.css';

const AudioPlayer: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            if (!isNaN(audio.duration) && audio.duration !== Infinity) {
                setDuration(audio.duration);
            } else {
                setDuration(0);
            }
            setCurrentTime(0);
        };

        const handleDurationChange = () => {
            if (!isNaN(audio.duration) && audio.duration !== Infinity) {
                setDuration(audio.duration);
            }
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            audio.currentTime = 0;
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioSrc]);

    // Listen for global pauseAll events
    useEffect(() => {
        const handlePauseAll = (e: Event) => {
            const source = (e as CustomEvent).detail?.source;
            if (source !== audioRef.current && audioRef.current?.paused === false) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        };

        audioEventTarget.addEventListener('pauseAll', handlePauseAll);

        return () => {
            audioEventTarget.removeEventListener('pauseAll', handlePauseAll);
        };
    }, []);

    // Pause on unmount for safety
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audioEventTarget.dispatchEvent(
                new CustomEvent('pauseAll', { detail: { source: audio } })
            );
            audio.play();
            setIsPlaying(true);
        }
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.muted = !audio.muted;
        setIsMuted(audio.muted);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setAudioSrc(url);
        setIsPlaying(false);
        setIsMuted(false);
        setCurrentTime(0);
        setDuration(0);
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const cycleSpeed = () => {
        const currentIndex = SPEED_OPTIONS.indexOf(playbackRate);
        const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
        const nextSpeed = SPEED_OPTIONS[nextIndex];
        setPlaybackRate(nextSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed;
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60)
            .toString()
            .padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <div className="audio-player">
            <input
                type="file"
                accept="audio/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden-input"
            />

            <audio ref={audioRef} src={audioSrc ?? undefined} preload="metadata" />

            <div className="audio-controls">
                <div className="audio-controls-group">
                    <button
                        onClick={handleBrowseClick}
                        className="control-button"
                        title="Upload audio file"
                    >
                        <Icon icon="material-symbols:upload" width={24} height={24} />
                    </button>

                    <button
                        className="control-button"
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        <Icon
                            icon={isMuted ? 'mdi:volume-off' : 'mdi:volume-high'}
                            width={20}
                            height={20}
                        />
                    </button>

                    <button
                        onClick={cycleSpeed}
                        className="control-button speed-button"
                        title="Click to change speed"
                    >
                        {playbackRate}x
                    </button>
                </div>

                <div className="seek-bar-container">
                    <span className="time-text">{formatTime(duration)}</span>
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        step="0.1"
                        className="seek-bar"
                        style={{
                            backgroundSize: `${duration ? (currentTime / duration) * 100 : 0}% 100%`,
                        }}
                    />
                    <span className="time-text">{formatTime(currentTime)}</span>
                </div>

                <button
                    className="play-button"
                    onClick={togglePlayPause}
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    <Icon
                        icon={isPlaying ? 'mdi:pause' : 'mdi:play'}
                        width={24}
                        height={24}
                    />
                </button>
            </div>
        </div>
    );
};

export default AudioPlayer;
