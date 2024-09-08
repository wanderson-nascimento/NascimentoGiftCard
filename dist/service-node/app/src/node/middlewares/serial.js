"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serial = void 0;
const co_body_1 = require("co-body");
const utils_1 = require("../utils");
async function serial(ctx, next) {
    const body = await co_body_1.json(ctx.req);
    const { vbase } = ctx.clients;
    const { serialNumber } = body;
    const { paymentId } = ctx.vtex.route.params;
    const response = {
        serial: '',
        time: Date.now(),
    };
    if (serialNumber === '1234') {
        ctx.status = 200;
        response.serial = serialNumber;
    }
    else {
        ctx.status = 500;
    }
    utils_1.persistSerialResponse(vbase, response, paymentId);
    ctx.body = response;
    await next();
}
exports.serial = serial;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL25vZGUvbWlkZGxld2FyZXMvc2VyaWFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUE4QjtBQUU5QixvQ0FBZ0Q7QUFFekMsS0FBSyxVQUFVLE1BQU0sQ0FBQyxHQUFZLEVBQUUsSUFBeUI7SUFDbEUsTUFBTSxJQUFJLEdBQUcsTUFBTSxjQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ2hDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFBO0lBRTdCLE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUE7SUFDN0IsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQTtJQUMzQyxNQUFNLFFBQVEsR0FBRztRQUNmLE1BQU0sRUFBRSxFQUFFO1FBQ1YsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7S0FDakIsQ0FBQTtJQUVELElBQUksWUFBWSxLQUFLLE1BQU0sRUFBRTtRQUMzQixHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQTtRQUNoQixRQUFRLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQTtLQUMvQjtTQUFNO1FBQ0wsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUE7S0FDakI7SUFFRCw2QkFBcUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0lBRWpELEdBQUcsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFBO0lBRW5CLE1BQU0sSUFBSSxFQUFFLENBQUE7QUFDZCxDQUFDO0FBdkJELHdCQXVCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpzb24gfSBmcm9tICdjby1ib2R5J1xuXG5pbXBvcnQgeyBwZXJzaXN0U2VyaWFsUmVzcG9uc2UgfSBmcm9tICcuLi91dGlscydcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcmlhbChjdHg6IENvbnRleHQsIG5leHQ6ICgpID0+IFByb21pc2U8dm9pZD4pIHtcbiAgY29uc3QgYm9keSA9IGF3YWl0IGpzb24oY3R4LnJlcSlcbiAgY29uc3QgeyB2YmFzZSB9ID0gY3R4LmNsaWVudHNcblxuICBjb25zdCB7IHNlcmlhbE51bWJlciB9ID0gYm9keVxuICBjb25zdCB7IHBheW1lbnRJZCB9ID0gY3R4LnZ0ZXgucm91dGUucGFyYW1zXG4gIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgIHNlcmlhbDogJycsXG4gICAgdGltZTogRGF0ZS5ub3coKSxcbiAgfVxuXG4gIGlmIChzZXJpYWxOdW1iZXIgPT09ICcxMjM0Jykge1xuICAgIGN0eC5zdGF0dXMgPSAyMDBcbiAgICByZXNwb25zZS5zZXJpYWwgPSBzZXJpYWxOdW1iZXJcbiAgfSBlbHNlIHtcbiAgICBjdHguc3RhdHVzID0gNTAwXG4gIH1cblxuICBwZXJzaXN0U2VyaWFsUmVzcG9uc2UodmJhc2UsIHJlc3BvbnNlLCBwYXltZW50SWQpXG5cbiAgY3R4LmJvZHkgPSByZXNwb25zZVxuXG4gIGF3YWl0IG5leHQoKVxufVxuIl19