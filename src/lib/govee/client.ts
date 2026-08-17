// Client Govee Open API -- server-only. GOVEE_API_KEY ne doit jamais
// atteindre le navigateur (même principe que l'ancien proxy OVH VPS, cf.
// git log) : ce module n'est importé que depuis src/app/api/govee, jamais
// depuis un composant "use client".
//
// L'appareil (sku + adresse device) n'est pas configuré à la main : on le
// découvre via GET /user/devices et on garde le premier éclairage trouvé.
// Un compte Govee mono-appareil (le cas ici) n'a donc plus aucun réglage
// à saisir -- seule la clé d'API reste nécessaire.
//
// Pas de contrôle de couleur : vérifié en direct (curl brut, contournant
// entièrement ce module) que /device/control renvoie "success" pour
// colorRgb/colorTemperatureK sans que l'appareil ne change jamais
// réellement de couleur, alors que powerSwitch et brightness, eux,
// propagent bien -- limitation côté plateforme Govee, documentée par
// d'autres intégrations (ex. github.com/wez/govee2mqtt#157), pas un bug
// d'appel ici. On/off reste donc la seule commande exposée.

const BASE_URL = "https://openapi.api.govee.com/router/api/v1";

export interface GoveeState {
  on: boolean;
  name: string;
}

export class GoveeNotConfiguredError extends Error {
  constructor(message = "GOVEE_API_KEY manquant") {
    super(message);
    this.name = "GoveeNotConfiguredError";
  }
}

function requireApiKey(): string {
  const apiKey = process.env.GOVEE_API_KEY;
  if (!apiKey) throw new GoveeNotConfiguredError();
  return apiKey;
}

async function goveeGet(path: string): Promise<Record<string, unknown>> {
  const r = await fetch(`${BASE_URL}${path}`, {
    headers: { "Govee-API-Key": requireApiKey() },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Govee HTTP ${r.status}`);
  return r.json();
}

async function goveePost(path: string, body: unknown): Promise<Record<string, unknown>> {
  const r = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Govee-API-Key": requireApiKey() },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Govee HTTP ${r.status}`);
  return r.json();
}

interface GoveeDevice {
  sku: string;
  device: string;
  deviceName: string;
  type: string;
}

async function listDevices(): Promise<GoveeDevice[]> {
  const data = await goveeGet("/user/devices");
  return (data.data as GoveeDevice[] | undefined) ?? [];
}

interface ResolvedDevice {
  sku: string;
  device: string;
  name: string;
}

// Découverte mise en cache en mémoire de process : sur Vercel, une
// instance serverless "chaude" garde cette variable entre invocations
// (elle repart à zéro seulement au cold start), ce qui évite un aller-
// retour /user/devices à chaque tap. La liste d'appareils d'un compte ne
// change de toute façon presque jamais.
let cachedDevice: { device: ResolvedDevice; expires: number } | null = null;
const TARGET_TTL = 10 * 60_000;

async function resolveDevice(): Promise<ResolvedDevice> {
  if (cachedDevice && Date.now() < cachedDevice.expires) return cachedDevice.device;

  const devices = await listDevices();
  const light = devices.find((d) => d.type === "devices.types.light") ?? devices[0];
  if (!light) throw new Error("Aucun appareil Govee trouvé sur ce compte");

  const device = { sku: light.sku, device: light.device, name: light.deviceName };
  cachedDevice = { device, expires: Date.now() + TARGET_TTL };
  return device;
}

interface GoveeCapabilityState {
  type: string;
  instance: string;
  state?: { value: unknown };
}

export async function getState(): Promise<GoveeState> {
  const target = await resolveDevice();
  const data = await goveePost("/device/state", {
    requestId: crypto.randomUUID(),
    payload: { sku: target.sku, device: target.device },
  });
  const capabilities = (data.payload as { capabilities?: GoveeCapabilityState[] } | undefined)?.capabilities ?? [];
  const power = capabilities.find((c) => c.instance === "powerSwitch");

  return { on: power?.state?.value === 1, name: target.name };
}

export async function setPower(on: boolean): Promise<void> {
  const target = await resolveDevice();
  await goveePost("/device/control", {
    requestId: crypto.randomUUID(),
    payload: {
      sku: target.sku,
      device: target.device,
      capability: { type: "devices.capabilities.on_off", instance: "powerSwitch", value: on ? 1 : 0 },
    },
  });
}
