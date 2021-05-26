
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Counter/Counter.svelte generated by Svelte v3.38.2 */

    const { console: console_1$1 } = globals;
    const file$5 = "src/Counter/Counter.svelte";

    function create_fragment$5(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let button3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Add shot";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Add segment";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Add suprasegment";
    			t5 = space();
    			button3 = element("button");
    			button3.textContent = "Stop the count";
    			add_location(button0, file$5, 57, 0, 1382);
    			add_location(button1, file$5, 58, 0, 1427);
    			add_location(button2, file$5, 59, 0, 1478);
    			add_location(button3, file$5, 60, 0, 1539);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, button3, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*handleKeydown*/ ctx[4], false, false, false),
    					listen_dev(button0, "click", /*addShot*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*addSegment*/ ctx[1], false, false, false),
    					listen_dev(button2, "click", /*addSuprasegment*/ ctx[2], false, false, false),
    					listen_dev(button3, "click", /*stopCount*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Counter", slots, []);
    	let { segmentCount = 1 } = $$props;
    	let { suprasegmentCount = 1 } = $$props;
    	let { initialTime } = $$props;
    	let { endTime } = $$props;
    	let { countStopped = false } = $$props;
    	let { exportData } = $$props;
    	let { shots } = $$props;

    	const addShot = () => {
    		let time = Date.now() / 1000 - initialTime;
    		let length = time - shots[shots.length - 1].time;

    		shots.push({
    			suprasegmentCount,
    			segmentCount,
    			time,
    			length
    		});
    	};

    	const addSegment = () => {
    		$$invalidate(5, segmentCount++, segmentCount);
    		addShot();
    	};

    	const addSuprasegment = () => {
    		$$invalidate(6, suprasegmentCount++, suprasegmentCount);
    		addSegment();
    	};

    	const stopCount = () => {
    		$$invalidate(7, endTime = Date.now() / 1000 - initialTime);
    		exportData();
    		$$invalidate(8, countStopped = true);
    	};

    	const handleKeydown = event => {
    		let key = event.key;
    		event.keyCode;
    		console.log(key);

    		if (key === "s" || key === "S" || key === " ") {
    			addShot();
    		} else if (key === "g" || key === "G") {
    			addSegment();
    		} else if (key === "u" || key === "U") {
    			addSuprasegment();
    		} else if (key === "Escape" || key === "Esc") {
    			if (!countStopped) {
    				stopCount();
    			}
    		}
    	};

    	const writable_props = [
    		"segmentCount",
    		"suprasegmentCount",
    		"initialTime",
    		"endTime",
    		"countStopped",
    		"exportData",
    		"shots"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Counter> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("segmentCount" in $$props) $$invalidate(5, segmentCount = $$props.segmentCount);
    		if ("suprasegmentCount" in $$props) $$invalidate(6, suprasegmentCount = $$props.suprasegmentCount);
    		if ("initialTime" in $$props) $$invalidate(9, initialTime = $$props.initialTime);
    		if ("endTime" in $$props) $$invalidate(7, endTime = $$props.endTime);
    		if ("countStopped" in $$props) $$invalidate(8, countStopped = $$props.countStopped);
    		if ("exportData" in $$props) $$invalidate(10, exportData = $$props.exportData);
    		if ("shots" in $$props) $$invalidate(11, shots = $$props.shots);
    	};

    	$$self.$capture_state = () => ({
    		segmentCount,
    		suprasegmentCount,
    		initialTime,
    		endTime,
    		countStopped,
    		exportData,
    		shots,
    		addShot,
    		addSegment,
    		addSuprasegment,
    		stopCount,
    		handleKeydown
    	});

    	$$self.$inject_state = $$props => {
    		if ("segmentCount" in $$props) $$invalidate(5, segmentCount = $$props.segmentCount);
    		if ("suprasegmentCount" in $$props) $$invalidate(6, suprasegmentCount = $$props.suprasegmentCount);
    		if ("initialTime" in $$props) $$invalidate(9, initialTime = $$props.initialTime);
    		if ("endTime" in $$props) $$invalidate(7, endTime = $$props.endTime);
    		if ("countStopped" in $$props) $$invalidate(8, countStopped = $$props.countStopped);
    		if ("exportData" in $$props) $$invalidate(10, exportData = $$props.exportData);
    		if ("shots" in $$props) $$invalidate(11, shots = $$props.shots);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		addShot,
    		addSegment,
    		addSuprasegment,
    		stopCount,
    		handleKeydown,
    		segmentCount,
    		suprasegmentCount,
    		endTime,
    		countStopped,
    		initialTime,
    		exportData,
    		shots
    	];
    }

    class Counter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			segmentCount: 5,
    			suprasegmentCount: 6,
    			initialTime: 9,
    			endTime: 7,
    			countStopped: 8,
    			exportData: 10,
    			shots: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Counter",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*initialTime*/ ctx[9] === undefined && !("initialTime" in props)) {
    			console_1$1.warn("<Counter> was created without expected prop 'initialTime'");
    		}

    		if (/*endTime*/ ctx[7] === undefined && !("endTime" in props)) {
    			console_1$1.warn("<Counter> was created without expected prop 'endTime'");
    		}

    		if (/*exportData*/ ctx[10] === undefined && !("exportData" in props)) {
    			console_1$1.warn("<Counter> was created without expected prop 'exportData'");
    		}

    		if (/*shots*/ ctx[11] === undefined && !("shots" in props)) {
    			console_1$1.warn("<Counter> was created without expected prop 'shots'");
    		}
    	}

    	get segmentCount() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set segmentCount(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get suprasegmentCount() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set suprasegmentCount(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get initialTime() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set initialTime(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get endTime() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endTime(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get countStopped() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countStopped(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get exportData() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set exportData(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shots() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shots(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Counter/CountResults.svelte generated by Svelte v3.38.2 */

    const file$4 = "src/Counter/CountResults.svelte";

    function create_fragment$4(ctx) {
    	let p0;
    	let t0;
    	let t1_value = /*countResults*/ ctx[0].shots.length + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let t4_value = /*countResults*/ ctx[0].segmentCount + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6;
    	let t7_value = /*countResults*/ ctx[0].suprasegmentCount + "";
    	let t7;
    	let t8;
    	let p3;
    	let t9;
    	let t10_value = Math.round(/*countResults*/ ctx[0].endTime * 100) / 100 + "";
    	let t10;
    	let t11;
    	let t12;
    	let p4;
    	let t13;
    	let t14_value = Math.round(/*countResults*/ ctx[0].averageShotLenght * 100) / 100 + "";
    	let t14;
    	let t15;
    	let t16;
    	let p5;
    	let t17;
    	let t18_value = Math.round(/*countResults*/ ctx[0].maxShotLenght * 100) / 100 + "";
    	let t18;
    	let t19;
    	let t20;
    	let p6;
    	let t21;
    	let t22_value = Math.round(/*countResults*/ ctx[0].minShotLenght * 100) / 100 + "";
    	let t22;
    	let t23;
    	let t24;
    	let a;
    	let t25;
    	let a_href_value;
    	let a_download_value;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Number of shots: ");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Number of segments: ");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text("Number of suprasegments: ");
    			t7 = text(t7_value);
    			t8 = space();
    			p3 = element("p");
    			t9 = text("Length of the film: ");
    			t10 = text(t10_value);
    			t11 = text(" seconds");
    			t12 = space();
    			p4 = element("p");
    			t13 = text("Average shot length: ");
    			t14 = text(t14_value);
    			t15 = text("\n    seconds");
    			t16 = space();
    			p5 = element("p");
    			t17 = text("Max shot length: ");
    			t18 = text(t18_value);
    			t19 = text(" seconds");
    			t20 = space();
    			p6 = element("p");
    			t21 = text("Min shot length: ");
    			t22 = text(t22_value);
    			t23 = text(" seconds");
    			t24 = space();
    			a = element("a");
    			t25 = text("Download CSV");
    			add_location(p0, file$4, 4, 0, 49);
    			add_location(p1, file$4, 5, 0, 101);
    			add_location(p2, file$4, 6, 0, 156);
    			add_location(p3, file$4, 7, 0, 221);
    			add_location(p4, file$4, 10, 0, 309);
    			add_location(p5, file$4, 15, 0, 420);
    			add_location(p6, file$4, 18, 0, 511);
    			attr_dev(a, "href", a_href_value = /*countResults*/ ctx[0].downloadLink);
    			attr_dev(a, "download", a_download_value = /*countResults*/ ctx[0].filmName + ".csv");
    			add_location(a, file$4, 21, 0, 602);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			append_dev(p0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t6);
    			append_dev(p2, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t9);
    			append_dev(p3, t10);
    			append_dev(p3, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t13);
    			append_dev(p4, t14);
    			append_dev(p4, t15);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, p5, anchor);
    			append_dev(p5, t17);
    			append_dev(p5, t18);
    			append_dev(p5, t19);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, p6, anchor);
    			append_dev(p6, t21);
    			append_dev(p6, t22);
    			append_dev(p6, t23);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t25);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*countResults*/ 1 && t1_value !== (t1_value = /*countResults*/ ctx[0].shots.length + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*countResults*/ 1 && t4_value !== (t4_value = /*countResults*/ ctx[0].segmentCount + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*countResults*/ 1 && t7_value !== (t7_value = /*countResults*/ ctx[0].suprasegmentCount + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*countResults*/ 1 && t10_value !== (t10_value = Math.round(/*countResults*/ ctx[0].endTime * 100) / 100 + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*countResults*/ 1 && t14_value !== (t14_value = Math.round(/*countResults*/ ctx[0].averageShotLenght * 100) / 100 + "")) set_data_dev(t14, t14_value);
    			if (dirty & /*countResults*/ 1 && t18_value !== (t18_value = Math.round(/*countResults*/ ctx[0].maxShotLenght * 100) / 100 + "")) set_data_dev(t18, t18_value);
    			if (dirty & /*countResults*/ 1 && t22_value !== (t22_value = Math.round(/*countResults*/ ctx[0].minShotLenght * 100) / 100 + "")) set_data_dev(t22, t22_value);

    			if (dirty & /*countResults*/ 1 && a_href_value !== (a_href_value = /*countResults*/ ctx[0].downloadLink)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*countResults*/ 1 && a_download_value !== (a_download_value = /*countResults*/ ctx[0].filmName + ".csv")) {
    				attr_dev(a, "download", a_download_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(p6);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CountResults", slots, []);
    	let { countResults } = $$props;
    	const writable_props = ["countResults"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CountResults> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("countResults" in $$props) $$invalidate(0, countResults = $$props.countResults);
    	};

    	$$self.$capture_state = () => ({ countResults });

    	$$self.$inject_state = $$props => {
    		if ("countResults" in $$props) $$invalidate(0, countResults = $$props.countResults);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [countResults];
    }

    class CountResults extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { countResults: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CountResults",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*countResults*/ ctx[0] === undefined && !("countResults" in props)) {
    			console.warn("<CountResults> was created without expected prop 'countResults'");
    		}
    	}

    	get countResults() {
    		throw new Error("<CountResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countResults(value) {
    		throw new Error("<CountResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Counter/Kokes.svelte generated by Svelte v3.38.2 */

    const file$3 = "src/Counter/Kokes.svelte";

    // (13:0) {#if kokes}
    function create_if_block$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*memik*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "500px");
    			attr_dev(img, "alt", "Pan Kokeš je momentálně nedostupný");
    			add_location(img, file$3, 14, 8, 310);
    			add_location(div, file$3, 13, 4, 296);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*memik*/ 2 && img.src !== (img_src_value = /*memik*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(13:0) {#if kokes}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*kokes*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*kokes*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Kokes", slots, []);
    	let kokes = false;
    	let memiky = ["images/kokes-1.jpg", "images/kokes-2.jpg"];
    	let memik;

    	const toggleKokes = () => {
    		$$invalidate(0, kokes = !kokes);
    		$$invalidate(1, memik = memiky[Math.floor(Math.random() * memiky.length)]);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Kokes> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ kokes, memiky, memik, toggleKokes });

    	$$self.$inject_state = $$props => {
    		if ("kokes" in $$props) $$invalidate(0, kokes = $$props.kokes);
    		if ("memiky" in $$props) memiky = $$props.memiky;
    		if ("memik" in $$props) $$invalidate(1, memik = $$props.memik);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [kokes, memik, toggleKokes];
    }

    class Kokes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { toggleKokes: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Kokes",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get toggleKokes() {
    		return this.$$.ctx[2];
    	}

    	set toggleKokes(value) {
    		throw new Error("<Kokes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Counter/Core.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$2 = "src/Counter/Core.svelte";

    // (93:4) {:else}
    function create_else_block(ctx) {
    	let input;
    	let t0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Start the count";
    			add_location(input, file$2, 93, 8, 2955);
    			add_location(button, file$2, 94, 8, 2995);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*filmName*/ ctx[0]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[18]),
    					listen_dev(button, "click", /*startCount*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filmName*/ 1 && input.value !== /*filmName*/ ctx[0]) {
    				set_input_value(input, /*filmName*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(93:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (91:27) 
    function create_if_block_1(ctx) {
    	let countresults;
    	let current;

    	countresults = new CountResults({
    			props: { countResults: /*countResults*/ ctx[8] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(countresults.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(countresults, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const countresults_changes = {};
    			if (dirty & /*countResults*/ 256) countresults_changes.countResults = /*countResults*/ ctx[8];
    			countresults.$set(countresults_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(countresults.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(countresults.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(countresults, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(91:27) ",
    		ctx
    	});

    	return block;
    }

    // (89:4) {#if countStarted && !countStopped}
    function create_if_block(ctx) {
    	let counter;
    	let updating_shots;
    	let updating_segmentCount;
    	let updating_suprasegmentCount;
    	let updating_countStopped;
    	let updating_endTime;
    	let current;

    	function counter_shots_binding(value) {
    		/*counter_shots_binding*/ ctx[13](value);
    	}

    	function counter_segmentCount_binding(value) {
    		/*counter_segmentCount_binding*/ ctx[14](value);
    	}

    	function counter_suprasegmentCount_binding(value) {
    		/*counter_suprasegmentCount_binding*/ ctx[15](value);
    	}

    	function counter_countStopped_binding(value) {
    		/*counter_countStopped_binding*/ ctx[16](value);
    	}

    	function counter_endTime_binding(value) {
    		/*counter_endTime_binding*/ ctx[17](value);
    	}

    	let counter_props = {
    		initialTime: /*initialTime*/ ctx[3],
    		exportData: /*exportData*/ ctx[12]
    	};

    	if (/*shots*/ ctx[7] !== void 0) {
    		counter_props.shots = /*shots*/ ctx[7];
    	}

    	if (/*segmentCount*/ ctx[5] !== void 0) {
    		counter_props.segmentCount = /*segmentCount*/ ctx[5];
    	}

    	if (/*suprasegmentCount*/ ctx[6] !== void 0) {
    		counter_props.suprasegmentCount = /*suprasegmentCount*/ ctx[6];
    	}

    	if (/*countStopped*/ ctx[2] !== void 0) {
    		counter_props.countStopped = /*countStopped*/ ctx[2];
    	}

    	if (/*endTime*/ ctx[4] !== void 0) {
    		counter_props.endTime = /*endTime*/ ctx[4];
    	}

    	counter = new Counter({ props: counter_props, $$inline: true });
    	binding_callbacks.push(() => bind(counter, "shots", counter_shots_binding));
    	binding_callbacks.push(() => bind(counter, "segmentCount", counter_segmentCount_binding));
    	binding_callbacks.push(() => bind(counter, "suprasegmentCount", counter_suprasegmentCount_binding));
    	binding_callbacks.push(() => bind(counter, "countStopped", counter_countStopped_binding));
    	binding_callbacks.push(() => bind(counter, "endTime", counter_endTime_binding));

    	const block = {
    		c: function create() {
    			create_component(counter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(counter, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const counter_changes = {};
    			if (dirty & /*initialTime*/ 8) counter_changes.initialTime = /*initialTime*/ ctx[3];

    			if (!updating_shots && dirty & /*shots*/ 128) {
    				updating_shots = true;
    				counter_changes.shots = /*shots*/ ctx[7];
    				add_flush_callback(() => updating_shots = false);
    			}

    			if (!updating_segmentCount && dirty & /*segmentCount*/ 32) {
    				updating_segmentCount = true;
    				counter_changes.segmentCount = /*segmentCount*/ ctx[5];
    				add_flush_callback(() => updating_segmentCount = false);
    			}

    			if (!updating_suprasegmentCount && dirty & /*suprasegmentCount*/ 64) {
    				updating_suprasegmentCount = true;
    				counter_changes.suprasegmentCount = /*suprasegmentCount*/ ctx[6];
    				add_flush_callback(() => updating_suprasegmentCount = false);
    			}

    			if (!updating_countStopped && dirty & /*countStopped*/ 4) {
    				updating_countStopped = true;
    				counter_changes.countStopped = /*countStopped*/ ctx[2];
    				add_flush_callback(() => updating_countStopped = false);
    			}

    			if (!updating_endTime && dirty & /*endTime*/ 16) {
    				updating_endTime = true;
    				counter_changes.endTime = /*endTime*/ ctx[4];
    				add_flush_callback(() => updating_endTime = false);
    			}

    			counter.$set(counter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(counter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(counter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(counter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(89:4) {#if countStarted && !countStopped}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let kokes_1;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*countStarted*/ ctx[1] && !/*countStopped*/ ctx[2]) return 0;
    		if (/*countStopped*/ ctx[2]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let kokes_1_props = {};
    	kokes_1 = new Kokes({ props: kokes_1_props, $$inline: true });
    	/*kokes_1_binding*/ ctx[19](kokes_1);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t = space();
    			create_component(kokes_1.$$.fragment);
    			add_location(div, file$2, 87, 0, 2626);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			insert_dev(target, t, anchor);
    			mount_component(kokes_1, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*handleKeydown*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			const kokes_1_changes = {};
    			kokes_1.$set(kokes_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(kokes_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(kokes_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t);
    			/*kokes_1_binding*/ ctx[19](null);
    			destroy_component(kokes_1, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Core", slots, []);
    	let { filmName = "Women on the run" } = $$props;
    	let countStarted = false;
    	let countStopped;
    	let initialTime;
    	let endTime;
    	let segmentCount;
    	let suprasegmentCount;

    	// this is a really terrible fix, but what can you do, it fixes stuff
    	let shots = [
    		{
    			suprasegmentCount: 0,
    			segmentCount: 0,
    			time: 0,
    			length: 0
    		}
    	];

    	const startCount = () => {
    		$$invalidate(1, countStarted = true);
    		$$invalidate(3, initialTime = Date.now() / 1000);
    	};

    	const handleKeydown = event => {
    		let key = event.key;
    		let keyCode = event.keyCode;
    		console.log("Key pressed: " + key + " with code: " + keyCode);

    		if (key === "Enter" && !countStarted) {
    			startCount();
    		} else if (key === "D") {
    			kokes.toggleKokes();
    		}
    	};

    	let countResults = {
    		averageShotLenght: 0,
    		maxShotLenght: 0,
    		minShotLenght: 0
    	};

    	const exportData = () => {
    		// remove empty shot, this is a crude fix, but oh well
    		shots.shift();

    		$$invalidate(8, countResults.shots = shots, countResults);
    		$$invalidate(8, countResults.segmentCount = segmentCount, countResults);
    		$$invalidate(8, countResults.suprasegmentCount = suprasegmentCount, countResults);
    		$$invalidate(8, countResults.initialTime = initialTime, countResults);
    		$$invalidate(8, countResults.endTime = endTime, countResults);
    		$$invalidate(8, countResults.shotTimes = shots.map(shot => shot.time), countResults);
    		$$invalidate(8, countResults.shotLengths = shots.map(shot => shot.length), countResults);
    		console.log(shots);
    		console.log(countResults.shotLengths);

    		if (shots.length > 0) {
    			$$invalidate(8, countResults.averageShotLenght = countResults.shotLengths.reduce((a, b) => a + b) / countResults.shotLengths.length, countResults);
    			$$invalidate(8, countResults.maxShotLenght = Math.max(...countResults.shotLengths), countResults);
    			$$invalidate(8, countResults.minShotLenght = Math.min(...countResults.shotLengths), countResults);
    		}

    		console.log(countResults);
    		let csvContent = "data:text/csv;charset=utf-8,suprasegment,segment,time,length\n" + shots.map(row => Object.values(row).join(",")).join("\n") + "\nfinal,count,avg shot len: " + countResults.averageShotLenght + ",max shot len: " + countResults.maxShotLenght + ",min shot len: " + countResults.minShotLenght + "\n";
    		$$invalidate(8, countResults.downloadLink = encodeURI(csvContent), countResults);
    	};

    	let kokes;
    	const writable_props = ["filmName"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Core> was created with unknown prop '${key}'`);
    	});

    	function counter_shots_binding(value) {
    		shots = value;
    		$$invalidate(7, shots);
    	}

    	function counter_segmentCount_binding(value) {
    		segmentCount = value;
    		$$invalidate(5, segmentCount);
    	}

    	function counter_suprasegmentCount_binding(value) {
    		suprasegmentCount = value;
    		$$invalidate(6, suprasegmentCount);
    	}

    	function counter_countStopped_binding(value) {
    		countStopped = value;
    		$$invalidate(2, countStopped);
    	}

    	function counter_endTime_binding(value) {
    		endTime = value;
    		$$invalidate(4, endTime);
    	}

    	function input_input_handler() {
    		filmName = this.value;
    		$$invalidate(0, filmName);
    	}

    	function kokes_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			kokes = $$value;
    			$$invalidate(9, kokes);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("filmName" in $$props) $$invalidate(0, filmName = $$props.filmName);
    	};

    	$$self.$capture_state = () => ({
    		Counter,
    		CountResults,
    		Kokes,
    		filmName,
    		countStarted,
    		countStopped,
    		initialTime,
    		endTime,
    		segmentCount,
    		suprasegmentCount,
    		shots,
    		startCount,
    		handleKeydown,
    		countResults,
    		exportData,
    		kokes
    	});

    	$$self.$inject_state = $$props => {
    		if ("filmName" in $$props) $$invalidate(0, filmName = $$props.filmName);
    		if ("countStarted" in $$props) $$invalidate(1, countStarted = $$props.countStarted);
    		if ("countStopped" in $$props) $$invalidate(2, countStopped = $$props.countStopped);
    		if ("initialTime" in $$props) $$invalidate(3, initialTime = $$props.initialTime);
    		if ("endTime" in $$props) $$invalidate(4, endTime = $$props.endTime);
    		if ("segmentCount" in $$props) $$invalidate(5, segmentCount = $$props.segmentCount);
    		if ("suprasegmentCount" in $$props) $$invalidate(6, suprasegmentCount = $$props.suprasegmentCount);
    		if ("shots" in $$props) $$invalidate(7, shots = $$props.shots);
    		if ("countResults" in $$props) $$invalidate(8, countResults = $$props.countResults);
    		if ("kokes" in $$props) $$invalidate(9, kokes = $$props.kokes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		filmName,
    		countStarted,
    		countStopped,
    		initialTime,
    		endTime,
    		segmentCount,
    		suprasegmentCount,
    		shots,
    		countResults,
    		kokes,
    		startCount,
    		handleKeydown,
    		exportData,
    		counter_shots_binding,
    		counter_segmentCount_binding,
    		counter_suprasegmentCount_binding,
    		counter_countStopped_binding,
    		counter_endTime_binding,
    		input_input_handler,
    		kokes_1_binding
    	];
    }

    class Core extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { filmName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Core",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get filmName() {
    		throw new Error("<Core>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filmName(value) {
    		throw new Error("<Core>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Header.svelte generated by Svelte v3.38.2 */

    const file$1 = "src/Header.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let h2;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Welcome to Cinecount";
    			t1 = space();
    			h2 = element("h2");
    			t2 = text("Counting for a film named: ");
    			t3 = text(/*filmName*/ ctx[0]);
    			attr_dev(h1, "class", "svelte-1a2l3u7");
    			add_location(h1, file$1, 5, 4, 55);
    			attr_dev(h2, "class", "svelte-1a2l3u7");
    			add_location(h2, file$1, 6, 4, 89);
    			add_location(div, file$1, 4, 0, 45);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*filmName*/ 1) set_data_dev(t3, /*filmName*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let { filmName } = $$props;
    	const writable_props = ["filmName"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("filmName" in $$props) $$invalidate(0, filmName = $$props.filmName);
    	};

    	$$self.$capture_state = () => ({ filmName });

    	$$self.$inject_state = $$props => {
    		if ("filmName" in $$props) $$invalidate(0, filmName = $$props.filmName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [filmName];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { filmName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*filmName*/ ctx[0] === undefined && !("filmName" in props)) {
    			console.warn("<Header> was created without expected prop 'filmName'");
    		}
    	}

    	get filmName() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filmName(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let t0;
    	let core;
    	let updating_filmName;
    	let t1;
    	let footer;
    	let blockquote;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let p3;
    	let t9;
    	let p4;
    	let t11;
    	let p5;
    	let current;

    	header = new Header({
    			props: { filmName: /*filmName*/ ctx[0] },
    			$$inline: true
    		});

    	function core_filmName_binding(value) {
    		/*core_filmName_binding*/ ctx[1](value);
    	}

    	let core_props = {};

    	if (/*filmName*/ ctx[0] !== void 0) {
    		core_props.filmName = /*filmName*/ ctx[0];
    	}

    	core = new Core({ props: core_props, $$inline: true });
    	binding_callbacks.push(() => bind(core, "filmName", core_filmName_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t0 = space();
    			create_component(core.$$.fragment);
    			t1 = space();
    			footer = element("footer");
    			blockquote = element("blockquote");
    			p0 = element("p");
    			p0.textContent = "Shortcuts:";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "S or SPACE - add shot";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "G - add segment";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "U - add suprasegment";
    			t9 = space();
    			p4 = element("p");
    			p4.textContent = "Enter - start counting";
    			t11 = space();
    			p5 = element("p");
    			p5.textContent = "Escape - end counting";
    			attr_dev(main, "class", "svelte-1s5u0aa");
    			add_location(main, file, 9, 0, 171);
    			add_location(p0, file, 16, 2, 322);
    			add_location(p1, file, 17, 2, 342);
    			add_location(p2, file, 18, 2, 373);
    			add_location(p3, file, 19, 2, 398);
    			add_location(p4, file, 20, 2, 428);
    			add_location(p5, file, 21, 2, 460);
    			set_style(blockquote, "align", "center");
    			set_style(blockquote, "text-align", "left");
    			set_style(blockquote, "color", "#768390");
    			add_location(blockquote, file, 15, 1, 253);
    			attr_dev(footer, "class", "svelte-1s5u0aa");
    			add_location(footer, file, 14, 0, 243);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t0);
    			mount_component(core, main, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, blockquote);
    			append_dev(blockquote, p0);
    			append_dev(blockquote, t3);
    			append_dev(blockquote, p1);
    			append_dev(blockquote, t5);
    			append_dev(blockquote, p2);
    			append_dev(blockquote, t7);
    			append_dev(blockquote, p3);
    			append_dev(blockquote, t9);
    			append_dev(blockquote, p4);
    			append_dev(blockquote, t11);
    			append_dev(blockquote, p5);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const header_changes = {};
    			if (dirty & /*filmName*/ 1) header_changes.filmName = /*filmName*/ ctx[0];
    			header.$set(header_changes);
    			const core_changes = {};

    			if (!updating_filmName && dirty & /*filmName*/ 1) {
    				updating_filmName = true;
    				core_changes.filmName = /*filmName*/ ctx[0];
    				add_flush_callback(() => updating_filmName = false);
    			}

    			core.$set(core_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(core.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(core.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(core);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let filmName;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function core_filmName_binding(value) {
    		filmName = value;
    		$$invalidate(0, filmName);
    	}

    	$$self.$capture_state = () => ({ Core, Header, filmName });

    	$$self.$inject_state = $$props => {
    		if ("filmName" in $$props) $$invalidate(0, filmName = $$props.filmName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [filmName, core_filmName_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
