import mitt from "mitt";
const bus = {};
const emitter = mitt();
bus.$on = emitter.on;
bus.$off = emitter.off;
bus.$emit = emitter.emit;

window.bus = bus
export default bus