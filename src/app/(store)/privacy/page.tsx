export const metadata = { title: "Privacy & retention" };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 space-y-5 leading-relaxed">
      <h1 className="font-display text-5xl font-extrabold tracking-[-0.04em]">Privacy &amp; retention</h1>
      <p>Mirrorcart only processes your photo after you tick the consent box. Your photo is resized in your browser (long side 1024 px, JPEG) and sent to our server, which stores it in our Vercel Blob storage and passes it to the YouCam API (Perfect Corp.) to generate try-on images. Your API key-free browser never talks to YouCam directly.</p>
      <h2 className="font-display text-2xl font-bold">What we keep, and for how long</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><b>Your photo and try-on results in our storage:</b> deleted automatically within 24 hours by an hourly clean-up job, or immediately when you press <b>Delete my photo</b>.</li>
        <li><b>Copies held by YouCam:</b> YouCam documents that uploaded and generated files are kept up to 30 days by default and that result links expire after 2 hours. When you press Delete, or when our 24-hour clean-up runs, we also call YouCam&apos;s task-delete API for every task we created from your photo, which YouCam documents as deleting that task&apos;s input and output files.</li>
        <li><b>Analytics events</b> (e.g. &quot;try-on completed&quot;, &quot;item removed after try-on&quot;) contain product ids only, never images or personal data.</li>
      </ul>
      <p>Sample models in demo mode are AI-generated fictional people. Nothing in this store is for sale.</p>
    </article>
  );
}
