export async function onRequestPost(context) {
  const { request } = context;
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = '42d1MGCDgUDGeMtCKg3pPRYk';

    const form = new FormData();
    form.append('image_file', image, image.name);
    form.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: form,
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Remove.bg API error' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resultBuffer = await response.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(resultBuffer))
    );
    const resultUrl = `data:image/png;base64,${base64}`;

    return new Response(JSON.stringify({ result: resultUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
