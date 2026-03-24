import './style.css';
import { GetOverview, StartLogin, GetLoginStatus, GetLoginQRCode, SaveSettings, ListEvents, SendText, PickMediaFile, SendMedia, Logout } from '../wailsjs/go/main/AppBridge';
import { ClipboardSetText } from '../wailsjs/runtime/runtime';

const state = {
  sessionId: '',
  eventAfterId: 0,
  polling: null,
  connected: null,
  events: [],
  recentInboundUserId: '',
  mediaFilePath: '',
  mediaType: '',
};

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="shell">
    <section class="layout">
      <div class="left-col">
        <div class="panel">
          <div class="panel-head">
            <div>
              <h2>本地服务</h2>
            </div>
          </div>
          <label class="field">
            <span>监听地址</span>
            <input id="listenAddr" placeholder="127.0.0.1:17890" />
          </label>
          <label class="field">
            <span>回调地址</span>
            <input id="webhookUrl" placeholder="https://example.com/webhook" />
          </label>
          <button id="saveSettingsBtn" class="primary wide">保存设置</button>
          <p class="hint">监听地址保存后需要重启生效；回调地址保存后立即用于新消息。</p>
        </div>

        <div class="panel account-panel">
          <div class="panel-head">
            <button id="accountActionBtn" class="primary">扫码登录</button>
          </div>
          <div id="accountState" class="account-state"></div>
          <div id="qrBlock" class="qr-block hidden">
            <img id="qrImage" alt="登录二维码" />
            <p id="qrHint" class="hint"></p>
          </div>
        </div>
      </div>

      <div class="right-col">
        <div class="panel compose-panel">
          <div class="panel-head">
            <div>
              <h2>发送消息</h2>
            </div>
          </div>
          <div class="summary-grid">
            <div class="summary-item inline-summary">
              <span class="inline-label">账号 ID</span>
              <div id="sendAccountId" class="static-value">未登录</div>
            </div>
            <div class="summary-item inline-summary">
              <span class="inline-label">目标用户 ID</span>
              <div id="sendToUserId" class="static-value">等待收到一条消息</div>
            </div>
          </div>
          <div class="summary-grid media-summary-grid">
            <div class="summary-item inline-summary">
              <span class="inline-label">媒体文件</span>
              <div id="mediaFilePath" class="static-value">未选择文件</div>
            </div>
            <div class="summary-item inline-summary">
              <span class="inline-label">类型</span>
              <div id="mediaType" class="static-value compact">文本</div>
            </div>
          </div>
          <div class="button-row">
            <button id="pickMediaBtn" class="ghost">选择文件</button>
            <button id="clearMediaBtn" class="ghost">清除文件</button>
          </div>
          <p id="sendHint" class="hint">默认直接发送文本。选择媒体文件后发送媒体；如果同时填写文本，会先发文本再发媒体。当前音频文件会按普通附件发送，不作为语音气泡下发。</p>
          <label class="field">
            <textarea id="sendText" rows="4" placeholder="输入一段文本。未选文件时发送文本；选中文件后会作为附带说明一起发送。"></textarea>
          </label>
          <button id="sendBtn" class="primary wide">发送</button>
        </div>

        <div class="panel events-panel">
          <div class="panel-head">
            <div>
              <h2>收发记录</h2>
            </div>
          </div>
          <div id="eventsEmpty" class="empty">暂无事件。完成收发后会显示在这里。</div>
          <div id="eventsList" class="events-list"></div>
        </div>
      </div>
    </section>
    <div id="toast" class="toast hidden"></div>
  </main>
`;

const els = {
  accountActionBtn: document.getElementById('accountActionBtn'),
  accountState: document.getElementById('accountState'),
  qrBlock: document.getElementById('qrBlock'),
  qrImage: document.getElementById('qrImage'),
  qrHint: document.getElementById('qrHint'),
  listenAddr: document.getElementById('listenAddr'),
  webhookUrl: document.getElementById('webhookUrl'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  sendAccountId: document.getElementById('sendAccountId'),
  sendToUserId: document.getElementById('sendToUserId'),
  sendHint: document.getElementById('sendHint'),
  sendText: document.getElementById('sendText'),
  mediaFilePath: document.getElementById('mediaFilePath'),
  mediaType: document.getElementById('mediaType'),
  pickMediaBtn: document.getElementById('pickMediaBtn'),
  clearMediaBtn: document.getElementById('clearMediaBtn'),
  sendBtn: document.getElementById('sendBtn'),
  eventsEmpty: document.getElementById('eventsEmpty'),
  eventsList: document.getElementById('eventsList'),
  toast: document.getElementById('toast'),
};

let toastTimer = null;

function showToast(message) {
  const text = message instanceof Error ? message.message : String(message);
  els.toast.textContent = text;
  els.toast.classList.remove('hidden');
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    els.toast.classList.add('hidden');
  }, 2600);
}

function escapeHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatBodyText(value) {
  return escapeHTML(value || '(空文本)').replaceAll('\n', '<br>');
}

function detectMediaType(filePath) {
  const lower = String(filePath || '').toLowerCase();
  if (!lower) return '';
  if (/\.(jpg|jpeg|png|gif|webp)$/.test(lower)) return 'image';
  if (/\.(mp4|mov|m4v)$/.test(lower)) return 'video';
  return 'file';
}

function bjTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date).replace(/\//g, '-');
}

function renderOverview(overview) {
  state.connected = overview.connected || null;
  if (document.activeElement !== els.listenAddr) {
    els.listenAddr.value = overview.settings.listen_addr || '';
  }
  if (document.activeElement !== els.webhookUrl) {
    els.webhookUrl.value = overview.settings.webhook_url || '';
  }

  if (overview.connected) {
    els.accountActionBtn.textContent = '退出登录';
    els.accountActionBtn.className = 'ghost';
    els.accountActionBtn.disabled = false;
    els.accountState.innerHTML = `
      <div class="identity-card">
        <div class="avatar">${overview.connected.account_id.slice(0, 2).toUpperCase()}</div>
        <div class="identity-copy">
          <h3>${overview.connected.account_id}</h3>
          <div class="identity-line inline-summary">
            <span class="identity-label inline-label">用户 ID</span>
            <div class="identity-user">
              <span class="identity-user-text" title="${overview.connected.ilink_user_id || '-'}">${overview.connected.ilink_user_id || '-'}</span>
              <button id="copyUserIdBtn" class="icon-btn" title="复制用户 ID" aria-label="复制用户 ID">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 9h9v11H9z"></path>
                  <path d="M6 5h9v2H8v9H6z"></path>
                </svg>
              </button>
            </div>
          </div>
          <p>最近入站：${bjTime(overview.connected.last_inbound_at)}</p>
        </div>
      </div>
    `;
    const copyBtn = document.getElementById('copyUserIdBtn');
    if (copyBtn && overview.connected.ilink_user_id) {
      copyBtn.addEventListener('click', async () => {
        await ClipboardSetText(overview.connected.ilink_user_id);
        showToast('用户 ID 已复制');
      });
    }
    els.qrBlock.classList.add('hidden');
    els.sendAccountId.textContent = overview.connected.account_id;
    syncSuggestedTarget();
  } else {
    els.accountActionBtn.textContent = '扫码登录';
    els.accountActionBtn.className = 'primary';
    els.accountActionBtn.disabled = Boolean(state.sessionId);
    els.accountState.innerHTML = ``;
    els.sendAccountId.textContent = '未登录';
    els.sendToUserId.textContent = '等待收到一条消息';
    state.recentInboundUserId = '';
    state.mediaFilePath = '';
    state.mediaType = '';
    els.sendText.value = '';
    syncSuggestedTarget();
  }
  updateSendState();
  updateMediaState();
}

function renderEvents() {
  els.eventsList.innerHTML = '';
  if (!state.events.length) {
    els.eventsEmpty.classList.remove('hidden');
    return;
  }
  els.eventsEmpty.classList.add('hidden');
  state.recentInboundUserId = '';
  for (let i = state.events.length - 1; i >= 0; i -= 1) {
    const item = state.events[i];
    if (!state.recentInboundUserId && item.direction === 'inbound' && item.from_user_id) {
      state.recentInboundUserId = item.from_user_id;
      break;
    }
  }
  syncSuggestedTarget();
  for (const item of state.events) {
    const row = document.createElement('article');
    row.className = 'event-row';
    const mediaHTML = item.media_file_name || item.media_path
      ? `
        <div class="event-meta">
          <span class="event-file">${escapeHTML(item.media_file_name || item.media_path)}</span>
          ${item.media_mime_type ? `<span class="event-mime">${escapeHTML(item.media_mime_type)}</span>` : ''}
        </div>
      `
      : '';
    row.innerHTML = `
      <header>
        <span class="event-time">${bjTime(item.created_at)}</span>
        <span class="pill ${item.direction}">${item.direction}</span>
        <span class="pill muted">${item.event_type}</span>
      </header>
      <div class="body">${formatBodyText(item.body_text)}</div>
      ${mediaHTML}
    `;
    els.eventsList.appendChild(row);
  }
}

function syncSuggestedTarget() {
  if (!state.connected) {
    els.sendToUserId.textContent = '等待收到一条消息';
    els.sendHint.textContent = '默认直接发送文本。选择媒体文件后发送媒体；如果同时填写文本，会先发文本再发媒体。当前音频文件会按普通附件发送，不作为语音气泡下发。';
    updateSendState();
    return;
  }
  if (state.recentInboundUserId) {
    els.sendToUserId.textContent = state.recentInboundUserId;
    els.sendHint.textContent = `将优先回复最近来信用户：${state.recentInboundUserId}。默认直接发送文本；选择媒体文件后发送媒体；如果同时填写文本，会先发文本再发媒体。当前音频文件会按普通附件发送，不作为语音气泡下发。`;
  } else {
    els.sendToUserId.textContent = '等待收到一条消息';
    els.sendHint.textContent = '还没有可回复的来信用户。请先让对方发一条消息过来。';
  }
  updateSendState();
}

function updateSendState() {
  const canReply = Boolean(state.connected && state.recentInboundUserId);
  els.sendText.disabled = !canReply;
  els.sendBtn.disabled = !canReply || (!els.sendText.value.trim() && !state.mediaFilePath);
}

function updateMediaState() {
  const canReply = Boolean(state.connected && state.recentInboundUserId);
  const hasFile = Boolean(state.mediaFilePath);
  els.mediaFilePath.textContent = state.mediaFilePath || '未选择文件';
  els.mediaFilePath.title = state.mediaFilePath || '';
  els.mediaType.textContent = state.mediaType || '文本';
  els.pickMediaBtn.disabled = !canReply;
  els.clearMediaBtn.disabled = !canReply || !hasFile;
  els.sendBtn.textContent = hasFile ? '发送媒体' : '发送文本';
  syncSuggestedTarget();
}

async function loadOverview() {
  const overview = await GetOverview();
  renderOverview(overview);
}

async function pollEvents() {
  const items = await ListEvents(state.eventAfterId, 100);
  if (items.length) {
    state.eventAfterId = items[items.length - 1].id;
    state.events.push(...items);
    if (state.events.length > 300) {
      state.events = state.events.slice(-300);
    }
    renderEvents();
  }
}

async function beginLogin() {
  const session = await StartLogin();
  state.sessionId = session.session_id;
  els.qrImage.src = await GetLoginQRCode(session.session_id);
  els.qrHint.textContent = '请使用微信扫描二维码完成连接。';
  els.qrBlock.classList.remove('hidden');
  els.accountActionBtn.textContent = '等待扫码...';
  els.accountActionBtn.disabled = true;
  if (state.polling) clearInterval(state.polling);
  state.polling = setInterval(checkLoginStatus, 3000);
}

async function checkLoginStatus() {
  if (!state.sessionId) return;
  const session = await GetLoginStatus(state.sessionId);
  if (session.status === 'confirmed') {
    clearInterval(state.polling);
    state.polling = null;
    state.sessionId = '';
    await loadOverview();
    showToast('登录成功');
    return;
  }
  if (session.status === 'expired' || session.status === 'error') {
    clearInterval(state.polling);
    state.polling = null;
    state.sessionId = '';
    els.qrHint.textContent = session.status === 'expired' ? '二维码已过期，请重新开始扫码登录。' : (session.error || '登录失败，请重试。');
    els.accountActionBtn.textContent = '扫码登录';
    els.accountActionBtn.disabled = false;
  }
}

async function saveSettings() {
  await SaveSettings(els.listenAddr.value.trim(), els.webhookUrl.value.trim());
  showToast('设置已保存。监听地址需要重启后生效。');
}

async function sendTextMessage() {
  const accountID = state.connected?.account_id || '';
  const toUserID = state.recentInboundUserId || '';
  const text = els.sendText.value.trim();
  if (!accountID || !toUserID) {
    showToast('当前没有可回复的目标用户。');
    return;
  }
  if (state.mediaFilePath) {
    await SendMedia(accountID, toUserID, state.mediaType, state.mediaFilePath, text);
    const sentType = state.mediaType || 'file';
    state.mediaFilePath = '';
    state.mediaType = '';
    els.sendText.value = '';
    updateMediaState();
    showToast(`${sentType} 已发送`);
    return;
  }
  if (!text) {
    showToast('消息内容为空。');
    return;
  }
  await SendText(accountID, toUserID, text);
  els.sendText.value = '';
  updateSendState();
  showToast('文本已发送');
}

async function pickMedia() {
  const selected = await PickMediaFile();
  if (!selected) {
    return;
  }
  state.mediaFilePath = selected;
  state.mediaType = detectMediaType(selected);
  updateMediaState();
}

function clearMedia() {
  state.mediaFilePath = '';
  state.mediaType = '';
  updateMediaState();
}

async function logout() {
  if (!state.connected) return;
  await Logout(state.connected.account_id);
  state.connected = null;
  state.sessionId = '';
  els.qrBlock.classList.add('hidden');
  await loadOverview();
  showToast('当前账号已在本地退出登录');
}

els.accountActionBtn.addEventListener('click', () => {
  const action = state.connected ? logout : beginLogin;
  action().catch(err => showToast(err));
});
els.saveSettingsBtn.addEventListener('click', () => saveSettings().catch(err => showToast(err)));
els.sendBtn.addEventListener('click', () => sendTextMessage().catch(err => showToast(err)));
els.sendText.addEventListener('input', () => updateSendState());
els.pickMediaBtn.addEventListener('click', () => pickMedia().catch(err => showToast(err)));
els.clearMediaBtn.addEventListener('click', () => clearMedia());

async function bootstrap() {
  await loadOverview();
  await pollEvents();
  setInterval(() => pollEvents().catch(console.error), 3000);
  setInterval(() => loadOverview().catch(console.error), 5000);
}

bootstrap().catch(err => showToast(err));
