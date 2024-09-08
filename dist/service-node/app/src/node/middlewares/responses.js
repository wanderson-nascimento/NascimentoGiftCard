"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveResponse = exports.getResponse = void 0;
const api_1 = require("@vtex/api");
const co_body_1 = require("co-body");
const acceptedFlows = ['authorize'];
/* eslint-disable no-console */
async function getResponse(ctx, next) {
    // const files = await ctx.clients.payloads.listFiles('payloads')
    // console.log('Files', files)
    const { flow } = ctx.vtex.route.params;
    if (typeof flow !== 'string') {
        throw new api_1.UserInputError(`flow parameter needs to be an string`);
    }
    if (!flow || !acceptedFlows.includes(flow)) {
        throw new api_1.UserInputError(`${flow} not supported`);
    }
    const data = await ctx.clients.payloads.get(flow, true);
    ctx.body = data;
    ctx.status = 200;
    await next();
}
exports.getResponse = getResponse;
async function saveResponse(ctx, next) {
    const { flow } = ctx.vtex.route.params;
    if (typeof flow !== 'string') {
        throw new api_1.UserInputError(`flow parameter needs to be an string`);
    }
    if (!flow || !acceptedFlows.includes(flow)) {
        throw new api_1.UserInputError(`${flow} not supported`);
    }
    const body = await co_body_1.json(ctx.req);
    await ctx.clients.payloads.save(flow, body);
    ctx.body = body;
    ctx.status = 200;
    await next();
}
exports.saveResponse = saveResponse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL25vZGUvbWlkZGxld2FyZXMvcmVzcG9uc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUEwQztBQUMxQyxxQ0FBOEI7QUFFOUIsTUFBTSxhQUFhLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtBQUVuQywrQkFBK0I7QUFDeEIsS0FBSyxVQUFVLFdBQVcsQ0FBQyxHQUFZLEVBQUUsSUFBeUI7SUFDdkUsaUVBQWlFO0lBQ2pFLDhCQUE4QjtJQUU5QixNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFBO0lBRXRDLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO1FBQzVCLE1BQU0sSUFBSSxvQkFBYyxDQUFDLHNDQUFzQyxDQUFDLENBQUE7S0FDakU7SUFFRCxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUMxQyxNQUFNLElBQUksb0JBQWMsQ0FBQyxHQUFHLElBQUksZ0JBQWdCLENBQUMsQ0FBQTtLQUNsRDtJQUVELE1BQU0sSUFBSSxHQUFHLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUV2RCxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtJQUNmLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFBO0lBRWhCLE1BQU0sSUFBSSxFQUFFLENBQUE7QUFDZCxDQUFDO0FBcEJELGtDQW9CQztBQUVNLEtBQUssVUFBVSxZQUFZLENBQUMsR0FBWSxFQUFFLElBQXlCO0lBQ3hFLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUE7SUFFdEMsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7UUFDNUIsTUFBTSxJQUFJLG9CQUFjLENBQUMsc0NBQXNDLENBQUMsQ0FBQTtLQUNqRTtJQUVELElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzFDLE1BQU0sSUFBSSxvQkFBYyxDQUFDLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFBO0tBQ2xEO0lBRUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxjQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBRWhDLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUUzQyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtJQUNmLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFBO0lBRWhCLE1BQU0sSUFBSSxFQUFFLENBQUE7QUFDZCxDQUFDO0FBbkJELG9DQW1CQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFVzZXJJbnB1dEVycm9yIH0gZnJvbSAnQHZ0ZXgvYXBpJ1xuaW1wb3J0IHsganNvbiB9IGZyb20gJ2NvLWJvZHknXG5cbmNvbnN0IGFjY2VwdGVkRmxvd3MgPSBbJ2F1dGhvcml6ZSddXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRSZXNwb25zZShjdHg6IENvbnRleHQsIG5leHQ6ICgpID0+IFByb21pc2U8dm9pZD4pIHtcbiAgLy8gY29uc3QgZmlsZXMgPSBhd2FpdCBjdHguY2xpZW50cy5wYXlsb2Fkcy5saXN0RmlsZXMoJ3BheWxvYWRzJylcbiAgLy8gY29uc29sZS5sb2coJ0ZpbGVzJywgZmlsZXMpXG5cbiAgY29uc3QgeyBmbG93IH0gPSBjdHgudnRleC5yb3V0ZS5wYXJhbXNcblxuICBpZiAodHlwZW9mIGZsb3cgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFVzZXJJbnB1dEVycm9yKGBmbG93IHBhcmFtZXRlciBuZWVkcyB0byBiZSBhbiBzdHJpbmdgKVxuICB9XG5cbiAgaWYgKCFmbG93IHx8ICFhY2NlcHRlZEZsb3dzLmluY2x1ZGVzKGZsb3cpKSB7XG4gICAgdGhyb3cgbmV3IFVzZXJJbnB1dEVycm9yKGAke2Zsb3d9IG5vdCBzdXBwb3J0ZWRgKVxuICB9XG5cbiAgY29uc3QgZGF0YSA9IGF3YWl0IGN0eC5jbGllbnRzLnBheWxvYWRzLmdldChmbG93LCB0cnVlKVxuXG4gIGN0eC5ib2R5ID0gZGF0YVxuICBjdHguc3RhdHVzID0gMjAwXG5cbiAgYXdhaXQgbmV4dCgpXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYXZlUmVzcG9uc2UoY3R4OiBDb250ZXh0LCBuZXh0OiAoKSA9PiBQcm9taXNlPHZvaWQ+KSB7XG4gIGNvbnN0IHsgZmxvdyB9ID0gY3R4LnZ0ZXgucm91dGUucGFyYW1zXG5cbiAgaWYgKHR5cGVvZiBmbG93ICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBVc2VySW5wdXRFcnJvcihgZmxvdyBwYXJhbWV0ZXIgbmVlZHMgdG8gYmUgYW4gc3RyaW5nYClcbiAgfVxuXG4gIGlmICghZmxvdyB8fCAhYWNjZXB0ZWRGbG93cy5pbmNsdWRlcyhmbG93KSkge1xuICAgIHRocm93IG5ldyBVc2VySW5wdXRFcnJvcihgJHtmbG93fSBub3Qgc3VwcG9ydGVkYClcbiAgfVxuXG4gIGNvbnN0IGJvZHkgPSBhd2FpdCBqc29uKGN0eC5yZXEpXG5cbiAgYXdhaXQgY3R4LmNsaWVudHMucGF5bG9hZHMuc2F2ZShmbG93LCBib2R5KVxuXG4gIGN0eC5ib2R5ID0gYm9keVxuICBjdHguc3RhdHVzID0gMjAwXG5cbiAgYXdhaXQgbmV4dCgpXG59XG4iXX0=