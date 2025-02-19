---
title: Actions
description: Send notifications when specific events occur in your Actor (task) run or build. Dynamically add data to the notification payload when sending the notification.
sidebar_position: 2
slug: /integrations/webhooks/actions
---

# Actions

**Send notifications when specific events occur in your Actor (task) run or build. Dynamically add data to the notification payload when sending the notification.**

---

Currently, the only available action is to send an HTTP POST request to a URL specified in the webhook. New actions will come later.

## HTTP request

This action sends an HTTP POST request to the provided URL with a JSON payload. The payload is defined using a payload template, a JSON-like syntax that extends JSON with the use of variables enclosed in double curly braces `{{variable}}`. This enables the payload to be dynamically injected with data at the time when the webhook is triggered.

The response to the POST request must have an HTTP status code in the `2XX` range. Otherwise, it is considered an error and the request is periodically retried with an exponential back-off: the first retry happens after roughly 1 minute, second after 2 minutes, third after 4 minutes etc. After 11 retries, which take around 32 hours, the system gives up and stops retrying the requests.

For safety reasons, the webhook URL should contain a secret token to ensure only Apify can invoke it. To test your endpoint, you can use the **Test** button in the user interface. Webhook HTTP requests time out in 30 seconds. If your endpoint performs a time-consuming operation, you should respond to the request immediately so that it does not time out before Apify receives the response. To ensure that the time-consuming operation is reliably finished, you can internally use a message queue to retry the operation on internal failure. In rare circumstances, the webhook might be invoked more than once, you should design your code to be idempotent to duplicate calls.

> If your request's URL points toward Apify, you don't need to add a token, since it will be added automatically.

### Payload template

The payload template is a JSON-like string, whose syntax is extended with the use of variables. This is useful when a custom payload structure is needed, but at the same time dynamic data, that is only known at the time of the webhook's invocation, need to be injected into the payload. Aside from the variables, the string must be a valid JSON.

The variables need to be enclosed in double curly braces and cannot be chosen arbitrarily. A pre-defined list, [that can be found below](#available-variables), shows all the currently available variables. Using any other variable than one of the pre-defined will result in a validation error.

The syntax of a variable therefore is: `{{oneOfAvailableVariables}}`. The variables support accessing nested properties with dot notation: `{{variable.property}}`.

#### Default payload template

```json
{
    "userId": {{userId}},
    "createdAt": {{createdAt}},
    "eventType": {{eventType}},
    "eventData": {{eventData}},
    "resource": {{resource}}
}
```

#### Default payload example

```json
{
    "userId": "abf6vtB2nvQZ4nJzo",
    "createdAt": "2019-01-09T15:59:56.408Z",
    "eventType": "ACTOR.RUN.SUCCEEDED",
    "eventData": {
        "actorId": "fW4MyDhgwtMLrB987",
        "actorRunId": "uPBN9qaKd2iLs5naZ"
    },
    "resource": {
        "id": "uPBN9qaKd2iLs5naZ",
        "actId": "fW4MyDhgwtMLrB987",
        "userId": "abf6vtB2nvQZ4nJzo",
        "startedAt": "2019-01-09T15:59:40.750Z",
        "finishedAt": "2019-01-09T15:59:56.408Z",
        "status": "SUCCEEDED",
        ...
    }
}
```

#### String interpolation

The payload template _is not_ a valid JSON by default. The resulting payload is, but not the template. In some cases this is limiting, so there is also updated syntax available, that allows to use templates that provide the same functionality, and are valid JSON at the same time.

With this new syntax, the default payload template - resulting in the same payload - looks like this:

```json
{
    "userId": "{{userId}}",
    "createdAt": "{{createdAt}}",
    "eventType": "{{eventType}}",
    "eventData": "{{eventData}}",
    "resource": "{{resource}}"
}
```

Notice that `resource` and `eventData` will actually become an object, even though in the template it's a string.

If the string being interpolated only contains the variable, the actual variable value is used in the payload. For example `"{{eventData}}"` results in an object. If the string contains more than just the variable, the string value of the variable will occur in the payload:

```json
{ "text": "My user id is {{userId}}" }
{ "text": "My user id is abf6vtB2nvQZ4nJzo" }
```


To turn on this new syntax, use **Interpolate variables in string fields** switch within Apify Console. In API it's called `shouldInterpolateStrings`. The field is always `true` when integrating Actors or tasks.

#### Payload template example

This example shows how you can use the payload template variables to send a custom object that displays the status of a RUN, its ID and a custom property:

```json
{
    "runId": {{resource.id}},
    "runStatus": {{resource.status}},
    "myProp": "hello world"
}
```

You may have noticed that the `eventData` and `resource` properties contain redundant data. This is for backwards compatibility. Feel free to only use `eventData` or `resource` in your templates, depending on your use case.

### Headers template

Headers is a JSON-like string where you can add additional information to the default header of the webhook request. You can pass the variables in the same way as in [payload template](#payload-template) (including the use of string interpolation and available variables). The resulting headers need to be a valid json object and values can be strings only.

It is important to notice that the following keys are hard-coded and will be re-written always.

| Variable                  | Value                   |
|---------------------------|-------------------------|
| `host`                    | request url             |
| `Content-Type`            | application/json        |
| `X-Apify-Webhook`         | Apify value             |
| `X-Apify-Webhook-Dispatch-Id` | Apify id            |
| `X-Apify-Request-Origin`   | Apify origin           |

### Description

Description is an optional string that you can add to the webhook. It serves for your information, it is not send with the http request when the webhook is dispatched.

### Available variables

| Variable    | Type   | Description                                                                         |
|-------------|--------|-------------------------------------------------------------------------------------|
| `userId`    | string | ID of the user who owns the webhook.                                                |
| `createdAt` | string | ISO string date of the webhook's trigger event.                                     |
| `eventType` | string | Type of the trigger event, [see Events](./events.md).              |
| `eventData` | Object | Data associated with the trigger event, [see Events](./events.md). |
| `resource`  | Object | The resource that caused the trigger event, [see below](#resource).                 |

#### Resource

The `resource` variable represents the triggering system resource. For example, when using the `ACTOR.RUN.SUCCEEDED` event, the resource is the Actor run. The variable will be replaced by the `Object` that you would receive as a response from the relevant API at the moment when the webhook is triggered. So for the Actor run resource, it would be the response of the [Get Actor run](/api/v2#/reference/actors/run-object-deprecated/get-run) API endpoint.

In addition to Actor runs, webhooks also support various events related to Actor builds. In such cases, the resource object will look like the response of the [Get Actor build](/api/v2#/reference/actor-builds/build-object/get-build) API endpoint.
