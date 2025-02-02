const core = require('@actions/core');
const { Octokit } = require('@octokit/rest');
const github = require('@actions/github');
const translate = require('@xrkffgg/google-translate');

// **********************************************************
const token = core.getInput('token');
const octokit = new Octokit({ auth: `token ${token}` });
const context = github.context;

async function run() {
  try {
    const { owner, repo } = context.repo;
    if (
      (context.eventName === 'issues' ||
        context.eventName === 'pull_request' ||
        context.eventName === 'pull_request_target') &&
      context.payload.action == 'opened'
    ) {
      const isIssue = context.eventName === 'issues';
      if (isIssue) {
        number = context.payload.issue.number;
        title = context.payload.issue.title;
        body = context.payload.issue.body;
      } else {
        number = context.payload.pull_request.number;
        title = context.payload.pull_request.title;
        body = context.payload.pull_request.body;
      }

      const translateTitle = core.getInput('translate-title') || 'true';
      const translateBody = core.getInput('translate-body') || 'true';

      if (translateTitle == 'true' && containsChinese(title)) {
        const { text: newTitle } = await translate(title, { to: 'en' });
        core.info(`[translate] [title out: ${newTitle}]`);
        await octokit.issues.update({
          owner,
          repo,
          issue_number: number,
          title: newTitle,
        });
        core.info(`[update title] [number: ${number}]`);
      }

      if (translateBody == 'true' && containsChinese(body)) {
        const { text: newBody } = await translate(body, { to: 'en' });
        core.info(`[translate] [body out: ${newBody}]`);
        await octokit.issues.createComment({
          owner,
          repo,
          issue_number: number,
          body: newBody,
        });
        core.info(`[create comment] [number: ${number}]`);
      }
    } else {
      core.setFailed(
        'This Action now only support "issues" or "pull_request" or "pull_request_target" "opened". If you need other, you can open a issue to https://github.com/actions-cool/translation-helper',
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

function containsChinese(body) {
  var patt = /[\u4e00-\u9fa5]/;
  const bodyString = body.toString().trim();
  const result = patt.test(bodyString);
  core.info(`[containsChinese] [${body} is ${result}]`);
  return result;
}

run();
