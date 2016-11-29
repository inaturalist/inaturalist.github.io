# Raspberry Pi notes

1. install raspbian from NOOBs
1. install chromium
1. update /boot/config.txt to support the 4k TV using instructions here http://www.raspberrypi.org/forums/viewtopic.php?f=38&t=79330. For full config see below. NOOBs defaults will show a pixellated display at the wrong res.
1. set gpu_mem to 128 to keep screen from flickering (doesn't seem necessary with the pi3)
1. install xscreensaver & configure it to show no screen saver to keep X from going into powersave
1. set chromium to display http://inaturalist.github.io/tv

## config.txt
```
disable_overscan=1
overscan_left=-150
overscan_right=-150
hdmi_ignore_edit=0xa5000080
hdmi_group=2
hdmi_mode=87
hdmi_cvt 3840 2160 24
max_framebuffer_width=3840
max_framebuffer_height=2160
hdmi_pixel_freq_limit=400000000
```
