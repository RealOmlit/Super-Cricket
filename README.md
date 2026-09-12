# Cricket Masters — Stadium Edition 2.1

## Play

1. Extract the entire ZIP into a folder.
2. Open `index.html` in Chrome, Edge, or another WebGL browser.
3. Open **Match setup** to choose team names, CPU difficulty, 2/5/10/20 overs and a target, then save and start. Defaults remain 24 runs in 12 balls.

There is no installation, Node.js requirement, online service, or CDN dependency. Keep `index.html`, `css`, `js`, and `assets` together. Extract the whole ZIP before opening the game.

## Controls

- Space: start / play shot / replay
- A / D or arrow keys: aim
- L: switch ground / lofted
- C: change camera
- P or Escape: pause / resume
- M: toggle sound
- Restart button: start a new innings

Meet the ball as the timing marker reaches the sweet spot near the right end of the meter. Ground shots crossing the rope score four; shots clearing it without bouncing score six. Fielders pursue and collect the ball and can catch aerial shots.

## This edition

- Stadium bowl with 8,512 seats, 7,059 spectators, roof trusses, pavilion, floodlight gantries, flags, advertising boards, and live scoreboard.
- Photographic turf and pitch materials, normal maps, mowing stripes, worn creases, and 20,000–150,000 wind-animated grass blades depending on graphics settings.
- Fourteen articulated people with varied faces, builds, hair, skin tones, kit numbers, helmets, grilles, pads, gloves, and bats.
- Run-up, overhead bowling, batting follow-through, running between wickets, fielding, and celebration animation. Batting hands follow the bat through joint-based inverse kinematics.
- Three camera views, ball-follow camera movement, ball trail, bounce dust, falling bails, and synthesized crowd / contact sound.
- Redesigned broadcast scoreboard, timing meter, keyboard and touch controls, mobile layouts, pause, restart, and innings result screen.

Players and stadium architecture are original procedural 3D models. They are not scanned humans or motion-capture assets. Bowling speed labels represent simulated bowling types; flight timing is deliberately slowed for playable batting. This remains a simplified chase rather than a full cricket simulator: six-ball overs, ten wickets, rotating strike, individual batting figures, bowled/caught dismissals and four/six boundaries are supported. Wides, no-balls, LBW, run-outs, appeals and a full two-innings match are not simulated. Running is automatic; only completed 2.8-second crossings score.

## Performance

Choose **Visuals → Low / Balanced / High / Ultra / Cinematic**. Presets change grass density, pixel ratio and shadow quality; Low disables shadows. Cinematic uses up to a 2.5 pixel ratio and 4096 shadow maps. CPU levels Rookie, Club, Professional and Legend adjust bowling pace, swing, timing tolerance and fielding speed. Team names appear in the HUD, stadium scoreboard, results and jersey lettering. Settings persist when browser storage is available. The game pauses when the browser tab becomes hidden. A GPU with WebGL support is required.

## Files

- `index.html`: interface.
- `css/style.css`: responsive visual design.
- `js/game.js`: match state, input, ball physics, scoring, cameras, and audio.
- `js/players.js`: athlete geometry and animation.
- `js/stadium.js`: architecture, crowd, grass, and atmosphere.
- `assets/three.min.js`: local Three.js engine.
- `assets/textures.js`: embedded image data for offline local-file use.
- `assets/equipment.js`: converted CC0 catching-net geometry, placed beside the boundary.
- `assets/cricket-ground.glb`: original catching-net source model. Despite its historical filename, it is a training net, not an entire stadium.
- `CREDITS.md`: source links and licenses.

To host on GitHub Pages, publish this folder's contents at the Pages root. All asset paths are relative and work in a repository subdirectory. No build step is required.

## Validation

Offline automated checks exercised geometry construction, finite player/instance transforms, start, pause, aim limits, help, missed balls, twelve-ball innings, restart, four correctly timed sixes to win, replay, custom names/targets, five-over limits, harder timing tolerance, all graphics presets and completed-run counting. Source syntax and packaged asset references were checked. These checks do not verify GPU rendering, frame rate, audio output, or browser appearance on your device.

## Lighting upgrade

High, Ultra and Cinematic enable an HDR composite pass with depth-based screen-space contact shading, restrained bloom, color grading and edge vignette. Grass blades use face-normal sunlight, backlight transmission and darker roots. Low and Balanced bypass post-processing. Devices without floating-point color render targets use the normal renderer. These are raster and screen-space effects, not hardware ray tracing or path tracing. Gameplay and offline loading are unchanged. GPU rendering and frame rate still need device verification.

## CPU challenge update

All levels have stronger fielding and tighter timing. Deliveries vary in pace, line and swing direction. Pro and Legend anticipate ball movement and shift six fielders toward previous shot directions between balls. Legend hides the timing panel and advance bowling-type hint. The scoreboard shows required run rate. Results save a personal best separately for each difficulty, overs and target when browser storage is available.
