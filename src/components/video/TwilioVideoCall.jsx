import React, { useState, useEffect, useRef } from 'react';
import Video from 'twilio-video';
import {
  Video as VideoIcon,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Monitor,
  MonitorOff,
  Circle,
  Users,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TwilioVideoCall({ 
  accessToken, 
  roomName, 
  identity,
  onDisconnect,
  onError 
}) {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSid, setRecordingSid] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState(null);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const screenTrackRef = useRef(null);

  useEffect(() => {
    connectToRoom();
    enumerateDevices();

    return () => {
      if (room) {
        room.disconnect();
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }
    };
  }, []);

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    }
  };

  const connectToRoom = async () => {
    try {
      setConnectionStatus('connecting');

      const connectedRoom = await Video.connect(accessToken, {
        name: roomName,
        audio: true,
        video: { width: 640, height: 480 },
        bandwidthProfile: {
          video: {
            mode: 'collaboration',
            maxSubscriptionBitrate: 2500000
          }
        },
        dominantSpeaker: true,
        networkQuality: {
          local: 1,
          remote: 1
        },
        preferredVideoCodecs: ['VP8'],
        maxAudioBitrate: 16000
      });

      setRoom(connectedRoom);
      setConnectionStatus('connected');

      // Attach local video track
      connectedRoom.localParticipant.videoTracks.forEach(publication => {
        if (localVideoRef.current && publication.track) {
          localVideoRef.current.appendChild(publication.track.attach());
        }
      });

      // Handle existing participants
      connectedRoom.participants.forEach(addParticipant);

      // Handle new participants joining
      connectedRoom.on('participantConnected', addParticipant);
      connectedRoom.on('participantDisconnected', removeParticipant);

      // Handle disconnection
      connectedRoom.on('disconnected', () => {
        setConnectionStatus('disconnected');
        if (onDisconnect) onDisconnect();
      });

    } catch (error) {
      console.error('Failed to connect to room:', error);
      setConnectionStatus('error');
      if (onError) onError(error);
    }
  };

  const addParticipant = (participant) => {
    setParticipants(prevParticipants => [...prevParticipants, participant]);

    // Attach existing tracks
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        attachTrack(publication.track, participant.identity);
      }
    });

    // Handle new tracks
    participant.on('trackSubscribed', track => {
      attachTrack(track, participant.identity);
    });

    participant.on('trackUnsubscribed', track => {
      detachTrack(track);
    });
  };

  const removeParticipant = (participant) => {
    setParticipants(prevParticipants => 
      prevParticipants.filter(p => p.identity !== participant.identity)
    );
    
    // Cleanup video element
    if (remoteVideoRefs.current[participant.identity]) {
      delete remoteVideoRefs.current[participant.identity];
    }
  };

  const attachTrack = (track, participantIdentity) => {
    const container = document.getElementById(`remote-video-${participantIdentity}`);
    if (container && track.kind === 'video') {
      const element = track.attach();
      element.className = 'w-full h-full object-cover';
      container.innerHTML = '';
      container.appendChild(element);
    } else if (track.kind === 'audio') {
      track.attach();
    }
  };

  const detachTrack = (track) => {
    track.detach().forEach(element => element.remove());
  };

  const toggleVideo = () => {
    if (room) {
      room.localParticipant.videoTracks.forEach(publication => {
        if (isVideoEnabled) {
          publication.track.disable();
        } else {
          publication.track.enable();
        }
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (room) {
      room.localParticipant.audioTracks.forEach(publication => {
        if (isAudioEnabled) {
          publication.track.disable();
        } else {
          publication.track.enable();
        }
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!room) return;

    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenTrackRef.current) {
          room.localParticipant.unpublishTrack(screenTrackRef.current);
          screenTrackRef.current.stop();
          screenTrackRef.current = null;
        }
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        
        const screenTrack = stream.getVideoTracks()[0];
        screenTrackRef.current = new Video.LocalVideoTrack(screenTrack);
        
        await room.localParticipant.publishTrack(screenTrackRef.current);
        setIsScreenSharing(true);

        // Handle user stopping screen share from browser
        screenTrack.onended = () => {
          if (isScreenSharing) {
            toggleScreenShare();
          }
        };
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
    }
  };

  const switchCamera = async (deviceId) => {
    if (!room) return;

    try {
      // Stop current video tracks
      room.localParticipant.videoTracks.forEach(publication => {
        publication.track.stop();
        room.localParticipant.unpublishTrack(publication.track);
      });

      // Create new video track with selected device
      const videoTrack = await Video.createLocalVideoTrack({
        deviceId: { exact: deviceId }
      });

      // Publish new track
      await room.localParticipant.publishTrack(videoTrack);

      // Attach to local video element
      if (localVideoRef.current) {
        localVideoRef.current.innerHTML = '';
        localVideoRef.current.appendChild(videoTrack.attach());
      }

      setSelectedVideoDevice(deviceId);
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  const switchMicrophone = async (deviceId) => {
    if (!room) return;

    try {
      room.localParticipant.audioTracks.forEach(publication => {
        publication.track.stop();
        room.localParticipant.unpublishTrack(publication.track);
      });

      const audioTrack = await Video.createLocalAudioTrack({
        deviceId: { exact: deviceId }
      });

      await room.localParticipant.publishTrack(audioTrack);
      setSelectedAudioDevice(deviceId);
    } catch (error) {
      console.error('Failed to switch microphone:', error);
    }
  };

  const disconnect = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
      if (onDisconnect) onDisconnect();
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900">
      {/* Connection Status */}
      {connectionStatus === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-50">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#1464F4]/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <VideoIcon className="w-8 h-8 text-[#1464F4]" />
            </div>
            <p className="text-white text-lg">Connecting to video call...</p>
          </div>
        </div>
      )}

      {/* Remote Participants */}
      <div className={`absolute inset-0 grid ${participants.length === 1 ? 'grid-cols-1' : participants.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'} gap-2 p-2`}>
        {participants.length === 0 ? (
          <div className="flex items-center justify-center bg-slate-800 rounded-xl">
            <div className="text-center text-slate-400">
              <Users className="w-16 h-16 mx-auto mb-3" />
              <p>Waiting for other participants...</p>
            </div>
          </div>
        ) : (
          participants.map((participant) => (
            <div
              key={participant.identity}
              className="relative bg-slate-800 rounded-xl overflow-hidden"
            >
              <div
                id={`remote-video-${participant.identity}`}
                className="w-full h-full"
              />
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <p className="text-white text-sm font-medium">
                  {participant.identity.startsWith('doctor_') ? '👨‍⚕️ Doctor' : '👤 Patient'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute bottom-20 right-4 w-48 h-36 bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl">
        <div ref={localVideoRef} className="w-full h-full" />
        {!isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <VideoOff className="w-8 h-8 text-slate-500" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
          You
        </div>
      </div>

      {/* Screen Share Indicator */}
      {isScreenSharing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
          <Badge className="bg-emerald-600 text-white gap-2 px-4 py-2">
            <Monitor className="w-4 h-4" />
            Sharing your screen
          </Badge>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 z-40">
          <Badge className="bg-red-600 text-white gap-2 px-4 py-2 animate-pulse">
            <Circle className="w-3 h-3 fill-current" />
            Recording
          </Badge>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg p-4">
        <div className="flex items-center justify-center gap-3">
          {/* Audio Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full transition-all ${
              isAudioEnabled 
                ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          {/* Video Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full transition-all ${
              isVideoEnabled 
                ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isVideoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          {/* Screen Share */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-full transition-all ${
              isScreenSharing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </Button>

          {/* End Call */}
          <Button
            onClick={disconnect}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            <Phone className="w-6 h-6 rotate-[135deg]" />
          </Button>

          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 text-white"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="p-2">
                <p className="text-xs font-semibold text-slate-500 mb-2">MICROPHONE</p>
                {audioDevices.map((device) => (
                  <DropdownMenuItem
                    key={device.deviceId}
                    onClick={() => switchMicrophone(device.deviceId)}
                    className={selectedAudioDevice === device.deviceId ? 'bg-slate-100' : ''}
                  >
                    {device.label || `Microphone ${device.deviceId.slice(0, 4)}`}
                  </DropdownMenuItem>
                ))}
                
                <p className="text-xs font-semibold text-slate-500 mb-2 mt-3">CAMERA</p>
                {videoDevices.map((device) => (
                  <DropdownMenuItem
                    key={device.deviceId}
                    onClick={() => switchCamera(device.deviceId)}
                    className={selectedVideoDevice === device.deviceId ? 'bg-slate-100' : ''}
                  >
                    {device.label || `Camera ${device.deviceId.slice(0, 4)}`}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Connection Quality */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
            {participants.length + 1} participant(s)
          </Badge>
          <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-600">
            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1 animate-pulse" />
            {connectionStatus}
          </Badge>
        </div>
      </div>
    </div>
  );
}