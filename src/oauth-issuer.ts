export function withAuthorizationServerIssuer(
  location: string,
  issuer: string,
): string {
  const redirect = new URL(location);
  redirect.searchParams.set("iss", issuer);
  return redirect.toString();
}
