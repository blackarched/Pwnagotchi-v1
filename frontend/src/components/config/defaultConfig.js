export const defaultConfig = {
  main: {
    name: 'pwnagotchi',
    lang: 'en',
    whitelist: [],
    plugins_dir: '/usr/local/share/pwnagotchi/custom-plugins/',
    custom_plugin_dir: '/usr/local/share/pwnagotchi/custom-plugins/',
    log_level: 'INFO'
  },
  ui: {
    display: {
      enabled: true,
      type: 'waveshare_2',
      color: 'black'
    },
    web: {
      enabled: true,
      address: '0.0.0.0',
      port: 8080,
      username: 'changeme',
      password: 'changeme'
    },
    fps: 0.5,
    face: {
      look_r: '( ͡° ͜ʖ ͡°)',
      look_l: '( ͡° ͜ʖ ͡°)',
      look_r_happy: '( ͡◕ ◡ ◕)',
      look_l_happy: '( ͡◕ ◡ ◕)',
      sleep: '(⌐■_■)',
      sleep2: '(⌐■_■)',
      awake: '(◕‿‿◕)',
      bored: '(-__-)',
      intense: '(°▃▃°)',
      cool: '(⌐■_■)',
      happy: '(◕‿◕)',
      excited: '(ᵔ◡ᵔ)',
      motivated: '(☼‿‿☼)',
      demotivated: '(≖__≖)',
      smart: '(✜‿‿✜)',
      lonely: '(ب__ب)',
      sad: '(╥☁╥ )',
      angry: '(╥﹏╥)',
      friend: '(♥‿‿♥)',
      broken: '(☓‿‿☓)',
      debug: '(#__#)'
    }
  },
  ai: {
    enabled: true,
    path: '/root/brain.nn',
    laziness: 0.05,
    epochs_if_over_99_threshold: 30,
    epochs_if_over_95_threshold: 10,
    epochs_if_over_50_threshold: 3,
    min_epochs: 1,
    max_epochs: 100,
    params: {
      gamma: 0.99,
      lr: 0.002,
      epsilon: 0.05,
      epsilon_min: 0.01,
      epsilon_decay: 0.995,
      replay_memory_size: 10000,
      min_replay_memory_size: 1000
    }
  },
  personality: {
    advertise: true,
    deauth: true,
    associate: true,
    channels: [],
    hop_recon_time: 10,
    hop_recon_time_min: 5,
    hop_recon_time_max: 15,
    recon_time: 30,
    max_inactive_scale: 2,
    max_interactions: 3,
    max_misses_for_recon: 5,
    excited_num_epochs: 10,
    bored_num_epochs: 15,
    sad_num_epochs: 25
  },
  bettercap: {
    enabled: true,
    scheme: 'http',
    hostname: '127.0.0.1',
    port: 8081,
    username: 'pwnagotchi',
    password: 'pwnagotchi'
  }
};