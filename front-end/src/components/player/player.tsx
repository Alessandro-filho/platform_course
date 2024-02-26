import '@vidstack/react/player/styles/base.css';

import { useEffect, useRef, useState } from 'react';

import {
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaCanPlayDetail,
  type MediaCanPlayEvent,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
  type MediaProviderChangeEvent,
} from '@vidstack/react';

import { VideoLayout } from './components/layouts/video-layout';

export function Player({ src, title, isEnding, lessonId, onTimeUpdate, onPlay, timeElapsed }) {
  const [isEndingTriggered, setIsEndingTriggered] = useState(false);
  let player = useRef<MediaPlayerInstance>(null);

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    }
  };

  useEffect(() => {
    return player.current!.subscribe(({ currentTime, duration }) => {
      onTimeUpdate(currentTime);
      let timeSub = duration - currentTime;
      if (timeSub <= 10 && !isEndingTriggered && currentTime > 10) {
        setIsEndingTriggered(true);
        if (isEnding) {
          isEnding(lessonId, true);
        }
      } else if (timeSub > 10) {
        setIsEndingTriggered(false);
      }
    });
  }, [isEnding, isEndingTriggered, lessonId, onTimeUpdate]);

  useEffect(() => {
    if (src) {
      return player.current!.subscribe(({ paused, viewType }) => {
        // console.log('is paused?', '->', state.paused);
        // console.log('is audio view?', '->', state.viewType === 'audio');
      });
    }
  }, [src]);

  function onProviderChange(
    provider: MediaProviderAdapter | null,
    nativeEvent: MediaProviderChangeEvent,
  ) {
    // We can configure provider's here.
    if (isHLSProvider(provider)) {
      provider.config = {};
    }
  }

  // We can listen for the `can-play` event to be notified when the player is ready.
  function onCanPlay(detail: MediaCanPlayDetail, nativeEvent: MediaCanPlayEvent) {
    // ...
  }

  return (
    <MediaPlayer
      className="w-full aspect-video bg-slate-900 text-white font-sans overflow-hidden rounded-md ring-media-focus data-[focus]:ring-4"
      title="Sprite Fight"
      src={src}
      crossorigin
      playsinline
      onProviderChange={onProviderChange}
      onCanPlay={onCanPlay}
      ref={player}
      onPlay={handlePlay}
      currentTime={timeElapsed}
    >
      <MediaProvider>
        <Poster
          className="absolute inset-0 block h-full w-full rounded-md opacity-0 transition-opacity data-[visible]:opacity-100 object-cover"
          src=""
          alt=""
        />
        {/* {textTracks.map((track) => (
          <Track {...track} key={track.src} />
        ))} */}
      </MediaProvider>

      <VideoLayout thumbnails="" title={title} />
    </MediaPlayer>
  );
}
